import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { cssVar } from '@doudou-start/airgate-theme';
import { api } from './api';
import type { GenerationTask, ModelInfo, PlatformInfo, UserInfo } from './api';

// 选项遵循 codex imagegen SKILL 推荐。`auto` 是默认值，请求时不发 size 字段，
// 让上游 image_generation 工具自己挑（gpt-image-2 通常会落到 1024×1024）。
// 其它 5 个固定值都满足 gpt-image-2 硬约束（边长≤3840、16 倍数、≤3:1、像素 ∈[655360,8294400]），
// 不会被网关侧 validateImageSize 挡掉。
const SIZE_AUTO = 'auto';
const SIZE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: SIZE_AUTO, label: 'Auto' },
  { value: '1024x1024', label: '1024×1024 (1K)' },
  { value: '1536x1024', label: '1536×1024 (1K)' },
  { value: '1024x1536', label: '1024×1536 (1K)' },
  { value: '2048x2048', label: '2048×2048 (2K)' },
  { value: '2048x1152', label: '2048×1152 (2K)' },
  { value: '1152x2048', label: '1152×2048 (2K)' },
  { value: '3840x2160', label: '3840×2160 (4K)' },
  { value: '2160x3840', label: '2160×3840 (4K)' },
];

const COUNT_OPTIONS = [1, 2, 3, 4];
const MAX_REFERENCE_BYTES = 10 * 1024 * 1024;
const IMAGE_MARKDOWN_RE = /!\[([^\]]*)\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+)\)/g;
const STORAGE_PLATFORM = 'airgate.studio.platform';
const STORAGE_MODEL = 'airgate.studio.model';

type GalleryItem = {
  id: string;
  url: string;
  prompt: string;
  size: string;
  model: string;
  platform: string;
  createdAt: number;
  dimensions?: string;
};

type Reference = {
  id: string;
  name: string;
  file: File;
  url: string;
};

interface ImageStudioPageProps {
  onExit?: () => void;
  userInfo: UserInfo | null;
  onUserInfoChange?: (info: UserInfo) => void;
}

function fileToDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('failed to read file'));
    reader.readAsDataURL(file);
  });
}

function extractFirstImageUrl(content?: string) {
  if (!content) return null;
  IMAGE_MARKDOWN_RE.lastIndex = 0;
  const match = IMAGE_MARKDOWN_RE.exec(content);
  if (!match) return null;
  return { alt: match[1] || '', url: match[2] };
}

function imageFilename(prompt: string, url: string) {
  const ext = (() => {
    const lower = url.toLowerCase();
    if (lower.startsWith('data:image/')) {
      const slash = lower.indexOf('/');
      const semi = lower.indexOf(';');
      if (slash > 0 && semi > slash) return lower.slice(slash + 1, semi).replace('jpeg', 'jpg');
    }
    const dot = lower.lastIndexOf('.');
    if (dot > 0 && dot < lower.length - 1) {
      const candidate = lower.slice(dot + 1).split(/[?#]/)[0];
      if (/^(png|jpe?g|webp|gif)$/.test(candidate)) return candidate.replace('jpeg', 'jpg');
    }
    return 'png';
  })();
  const base = (prompt || 'image')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'image';
  return `${base}.${ext}`;
}

function downloadFromUrl(url: string, filename: string) {
  if (url.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    return;
  }
  fetch(url, { credentials: 'omit' })
    .then(r => r.blob())
    .then(blob => {
      const objectURL = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectURL;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectURL), 5000);
    })
    .catch(() => {
      window.open(url, '_blank');
    });
}

function probeImageDimensions(url: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(`${img.naturalWidth}×${img.naturalHeight}`);
    img.onerror = () => resolve('');
    img.src = url;
  });
}

function generateLocalId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function waitForGenerationTask(taskID: number, signal: AbortSignal): Promise<GenerationTask> {
  for (let i = 0; i < 120; i += 1) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const task = await api.getGenerationTask(taskID);
    if (task.status === 'completed') return task;
    if (task.status === 'failed') throw new Error(task.error_message || '生成失败');
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, 2000);
      signal.addEventListener('abort', () => {
        window.clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    });
  }
  throw new Error('生成超时');
}

function readLocalStorageValue(key: string) {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeLocalStorageValue(key: string, value: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private mode or locked-down browsers.
  }
}

function platformDisplayName(platforms: PlatformInfo[], name: string) {
  return platforms.find(p => p.name === name)?.display_name || name;
}

export default function ImageStudioPage({ onExit, userInfo, onUserInfoChange }: ImageStudioPageProps) {
  const { t } = useTranslation();
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [platform, setPlatform] = useState<string>(() => readLocalStorageValue(STORAGE_PLATFORM));
  const [modelID, setModelID] = useState<string>(() => readLocalStorageValue(STORAGE_MODEL));
  const [selectedSize, setSelectedSize] = useState<string>(SIZE_AUTO);
  const [count, setCount] = useState<number>(1);
  const [prompt, setPrompt] = useState('');
  const [references, setReferences] = useState<Reference[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<GalleryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load platforms once
  useEffect(() => {
    let cancelled = false;
    api.listPlatforms().then(list => {
      if (cancelled) return;
      setPlatforms(list);
      if (list.length && !list.some(p => p.name === platform)) {
        setPlatform(list[0].name);
      }
    }).catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load models for current platform
  useEffect(() => {
    if (!platform) { setModels([]); return; }
    let cancelled = false;
    api.listModels(platform, 'image_generation').then(list => {
      if (cancelled) return;
      setModels(list);
      if (list.length && !list.some(m => m.id === modelID)) {
        setModelID(list[0].id);
      } else if (!list.length) {
        setModelID('');
      }
    }).catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  useEffect(() => {
    writeLocalStorageValue(STORAGE_PLATFORM, platform || null);
  }, [platform]);

  useEffect(() => {
    writeLocalStorageValue(STORAGE_MODEL, modelID || null);
  }, [modelID]);

  // Cleanup refs on unmount
  useEffect(() => () => {
    references.forEach(r => URL.revokeObjectURL(r.url));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 'auto' 表示不向后端发 size，让上游 image_generation 工具决定。
  // 其它值都已在 SIZE_OPTIONS 里预校验过 gpt-image-2 硬约束。
  const size = selectedSize;
  const selectedModel = useMemo(() => models.find(m => m.id === modelID), [models, modelID]);
  const isEditMode = references.length > 0;
  const canGenerate = Boolean(platform && modelID && prompt.trim() && !busy);

  const refreshUserInfo = useCallback(async () => {
    if (!onUserInfoChange) return;
    try {
      const info = await api.getUserInfo();
      onUserInfoChange(info);
    } catch { /* ignore */ }
  }, [onUserInfoChange]);

  const addReferences = useCallback(async (files: File[]) => {
    const images = files.filter(f => f.type.startsWith('image/'));
    if (!images.length) return;
    if (images.some(f => f.size > MAX_REFERENCE_BYTES)) {
      setError(t('image_studio.reference_too_large', { defaultValue: 'Reference image exceeds 10 MB' }));
      return;
    }
    const next: Reference[] = images.map(file => ({
      id: generateLocalId(),
      name: file.name || 'reference',
      file,
      url: URL.createObjectURL(file),
    }));
    setReferences(prev => [...prev, ...next].slice(0, 4));
    setError('');
  }, [t]);

  const removeReference = useCallback((id: string) => {
    setReferences(prev => {
      const removed = prev.find(r => r.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter(r => r.id !== id);
    });
  }, []);

  const handleFileInput = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length) await addReferences(files);
    event.target.value = '';
  }, [addReferences]);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files ? Array.from(event.dataTransfer.files) : [];
    if (files.length) await addReferences(files);
  }, [addReferences]);

  const generateOne = useCallback(async (
    activePlatform: string,
    activeModel: string,
    promptText: string,
    activeSize: string,
    refs: Reference[],
    signal: AbortSignal,
  ): Promise<{ url: string } | null> => {
    const inputs = refs.length > 0
      ? await Promise.all(refs.map(async ref => ({ type: 'image' as const, role: 'source', url: await fileToDataURL(ref.file) })))
      : undefined;
    const task = await api.createGenerationTask({
      kind: 'image',
      operation: refs.length > 0 ? 'edit' : 'generate',
      platform: activePlatform,
      model: activeModel,
      prompt: promptText,
      parameters: activeSize && activeSize !== SIZE_AUTO ? { size: activeSize } : undefined,
      inputs,
    });
    const completed = await waitForGenerationTask(task.id, signal);
    const found = extractFirstImageUrl(completed.result_content);
    return found ? { url: found.url } : null;
  }, []);

  const generate = useCallback(async () => {
    if (!canGenerate) return;
    setError('');
    setBusy(true);
    setProgress({ done: 0, total: count });
    const abort = new AbortController();
    abortRef.current = abort;
    const promptText = prompt.trim();
    const activeSize = size;
    const activePlatform = platform;
    const activeModel = modelID;
    const refsCopy = [...references];

    const tasks = Array.from({ length: count }, () =>
      generateOne(activePlatform, activeModel, promptText, activeSize, refsCopy, abort.signal)
        .then(result => {
          if (!result) return null;
          const item: GalleryItem = {
            id: generateLocalId(),
            url: result.url,
            prompt: promptText,
            size: activeSize,
            model: activeModel,
            platform: activePlatform,
            createdAt: Date.now(),
          };
          setGallery(prev => [item, ...prev]);
          probeImageDimensions(result.url).then(dim => {
            if (dim) setGallery(prev => prev.map(g => g.id === item.id ? { ...g, dimensions: dim } : g));
          });
          return item;
        })
        .catch(err => {
          if (abort.signal.aborted) return null;
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          return null;
        })
        .finally(() => {
          setProgress(prev => prev ? { ...prev, done: prev.done + 1 } : prev);
        })
    );

    await Promise.all(tasks);
    setBusy(false);
    setProgress(null);
    abortRef.current = null;
    void refreshUserInfo();
  }, [canGenerate, prompt, size, platform, modelID, count, references, generateOne, refreshUserInfo]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setProgress(null);
  }, []);

  const useAsReference = useCallback(async (item: GalleryItem) => {
    try {
      const resp = await fetch(item.url);
      const blob = await resp.blob();
      const file = new File([blob], imageFilename(item.prompt, item.url), { type: blob.type || 'image/png' });
      await addReferences([file]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [addReferences]);

  const reusePrompt = useCallback((item: GalleryItem) => {
    setPrompt(item.prompt);
    // 老画廊条目可能存的是已废弃的 size 字符串（base+ratio 算出来的非 SKILL 推荐值），
    // 找不到匹配项就回落到 auto，避免选中一个不在选项里的值。
    const known = SIZE_OPTIONS.some(o => o.value === item.size);
    setSelectedSize(known ? item.size : SIZE_AUTO);
    if (item.platform) setPlatform(item.platform);
    if (item.model) setModelID(item.model);
  }, []);

  const removeFromGallery = useCallback((id: string) => {
    setGallery(prev => prev.filter(g => g.id !== id));
  }, []);

  // ── Render helpers ──

  const renderSegmented = <T extends string | number>(
    options: Array<{ value: T; label: string }>,
    value: T,
    onChange: (v: T) => void,
    ariaLabel: string,
  ) => (
    <div role="radiogroup" aria-label={ariaLabel} style={styles.segmented}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            style={{ ...styles.segmentedItem, ...(active ? styles.segmentedItemActive : null) }}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const noImageModelHint = !models.length && platform;

  return (
    <div data-full-bleed data-pg-aesthetic style={styles.layout}>
      {preview && (
        <div style={styles.previewOverlay} onClick={() => setPreview(null)}>
          <div style={styles.previewModal} onClick={e => e.stopPropagation()}>
            <img src={preview.url} alt={preview.prompt} style={styles.previewImage} />
            <div style={styles.previewMeta}>
              <span style={styles.previewMetaLabel}>{preview.model}</span>
              <span style={styles.previewMetaLabel}>{preview.dimensions || preview.size}</span>
            </div>
            <button
              type="button"
              style={styles.previewClose}
              onClick={() => setPreview(null)}
              aria-label={t('image_studio.close_preview', { defaultValue: 'Close preview' })}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <header style={styles.topBar}>
        <div style={styles.topBarLeft}>
          {onExit && (
            <button
              type="button"
              style={styles.modeBtn}
              onClick={onExit}
              title={t('image_studio.switch_to_chat', { defaultValue: 'Switch to chat' })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{t('image_studio.chat_mode', { defaultValue: 'Chat' })}</span>
            </button>
          )}
          <div style={styles.modePill}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span>{t('image_studio.title', { defaultValue: 'Image Studio' })}</span>
          </div>
        </div>
        <div style={styles.topBarRight}>
          {userInfo && (
            <span style={styles.balance}>
              <span style={styles.balanceLabel}>{t('playground.balance', { defaultValue: 'Balance' })}</span>
              <span style={styles.balanceValue}>${userInfo.balance.toFixed(4)}</span>
            </span>
          )}
        </div>
      </header>

      <div style={styles.body}>
        {/* ── Params panel ── */}
        <aside style={styles.params}>
          <section style={styles.paramSection}>
            <label style={styles.paramLabel}>{t('image_studio.platform', { defaultValue: 'Platform' })}</label>
            <select
              style={styles.select}
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              disabled={busy}
            >
              {!platforms.length && <option value="">{t('image_studio.no_platforms', { defaultValue: 'No platforms' })}</option>}
              {platforms.map(p => (
                <option key={p.name} value={p.name}>{p.display_name || p.name}</option>
              ))}
            </select>
          </section>

          <section style={styles.paramSection}>
            <label style={styles.paramLabel}>{t('image_studio.model', { defaultValue: 'Model' })}</label>
            <select
              style={styles.select}
              value={modelID}
              onChange={e => setModelID(e.target.value)}
              disabled={busy || !models.length}
            >
              {!models.length && (
                <option value="">{t('image_studio.no_image_models', { defaultValue: 'No image models on this platform' })}</option>
              )}
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name || m.id}</option>
              ))}
            </select>
            {selectedModel && (
              <span style={styles.modelMeta}>
                {platformDisplayName(platforms, selectedModel.platform || platform)}
              </span>
            )}
          </section>

          <section style={styles.paramSection}>
            <label style={styles.paramLabel}>{t('image_studio.size', { defaultValue: 'Size' })}</label>
            <div style={styles.sizeGrid}>
              {SIZE_OPTIONS.map(opt => {
                const active = opt.value === selectedSize;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    style={{ ...styles.ratioBtn, ...(active ? styles.ratioBtnActive : null) }}
                    onClick={() => setSelectedSize(opt.value)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <span style={styles.sizePreview}>
              {selectedSize === SIZE_AUTO
                ? t('image_studio.size_auto_hint', { defaultValue: 'Upstream picks (default 1024×1024)' })
                : selectedSize}
            </span>
          </section>

          <section style={styles.paramSection}>
            <label style={styles.paramLabel}>{t('image_studio.count', { defaultValue: 'Images per run' })}</label>
            {renderSegmented(
              COUNT_OPTIONS.map(n => ({ value: n, label: String(n) })),
              count,
              v => setCount(v),
              'Image count',
            )}
          </section>

          <section style={styles.paramSection}>
            <label style={styles.paramLabel}>
              {isEditMode
                ? t('image_studio.references_active', { defaultValue: 'References (edit mode)' })
                : t('image_studio.references', { defaultValue: 'References (optional)' })}
            </label>
            <div
              style={{ ...styles.dropzone, ...(isEditMode ? styles.dropzoneActive : null) }}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />
              {references.length === 0 ? (
                <span style={styles.dropzoneHint}>
                  {t('image_studio.dropzone_hint', { defaultValue: 'Drop image, or click to upload' })}
                </span>
              ) : (
                <div style={styles.referenceList}>
                  {references.map(ref => (
                    <div key={ref.id} style={styles.referenceItem}>
                      <img src={ref.url} alt={ref.name} style={styles.referenceThumb} />
                      <button
                        type="button"
                        style={styles.referenceRemove}
                        onClick={e => { e.stopPropagation(); removeReference(ref.id); }}
                        aria-label={t('image_studio.remove_reference', { defaultValue: 'Remove reference' })}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {isEditMode && (
              <span style={styles.editHint}>
                {t('image_studio.edit_hint', { defaultValue: 'Generation will use /images/edits with the reference.' })}
              </span>
            )}
          </section>
        </aside>

        {/* ── Workspace ── */}
        <main style={styles.workspace}>
          <section style={styles.promptCard}>
            <textarea
              style={styles.promptInput}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={t('image_studio.prompt_placeholder', {
                defaultValue: 'Describe what you want to create. Include subject, style, lighting, composition...',
              })}
              rows={4}
              disabled={busy}
            />
            <div style={styles.promptActions}>
              <div style={styles.promptStatus}>
                {progress && (
                  <span style={styles.progressText}>
                    {t('image_studio.generating_n_of_m', {
                      defaultValue: '{{done}} / {{total}}',
                      done: progress.done,
                      total: progress.total,
                    })}
                  </span>
                )}
                {!progress && noImageModelHint && (
                  <span style={styles.hintText}>
                    {t('image_studio.no_image_models_hint', {
                      defaultValue: 'No image-only models available on this platform.',
                    })}
                  </span>
                )}
                {!progress && !noImageModelHint && size && (
                  <span style={styles.hintText}>
                    {size} · {count}× · {isEditMode ? t('image_studio.edit', { defaultValue: 'edit' }) : t('image_studio.generate', { defaultValue: 'generate' })}
                  </span>
                )}
              </div>
              {busy ? (
                <button type="button" style={styles.cancelBtn} onClick={cancel}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="2" width="8" height="8" rx="1" /></svg>
                  {t('image_studio.stop', { defaultValue: 'Stop' })}
                </button>
              ) : (
                <button
                  type="button"
                  style={{ ...styles.generateBtn, opacity: canGenerate ? 1 : 0.4 }}
                  onClick={generate}
                  disabled={!canGenerate}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 3l4 4-4 4" />
                    <path d="M3 7h12a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6H9" />
                  </svg>
                  {isEditMode
                    ? t('image_studio.generate_edit', { defaultValue: 'Generate edit' })
                    : t('image_studio.generate', { defaultValue: 'Generate' })}
                </button>
              )}
            </div>
            {error && <div style={styles.errorBar}>{error}</div>}
          </section>

          <section style={styles.gallerySection}>
            <header style={styles.galleryHeader}>
              <h2 style={styles.galleryTitle}>
                {t('image_studio.results', { defaultValue: 'Results' })}
                {gallery.length > 0 && <span style={styles.galleryCount}>{gallery.length}</span>}
              </h2>
              {gallery.length > 0 && (
                <button
                  type="button"
                  style={styles.clearBtn}
                  onClick={() => setGallery([])}
                >
                  {t('image_studio.clear', { defaultValue: 'Clear' })}
                </button>
              )}
            </header>

            {gallery.length === 0 ? (
              <div style={styles.galleryEmpty}>
                <div style={styles.galleryEmptyIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <span style={styles.galleryEmptyText}>
                  {t('image_studio.empty_gallery', { defaultValue: 'Generated images appear here' })}
                </span>
              </div>
            ) : (
              <div style={styles.galleryGrid}>
                {gallery.map(item => (
                  <div key={item.id} style={styles.galleryCard}>
                    <button
                      type="button"
                      style={styles.galleryThumb}
                      onClick={() => setPreview(item)}
                      aria-label={t('image_studio.open_preview', { defaultValue: 'Open preview' })}
                    >
                      <img src={item.url} alt={item.prompt} style={styles.galleryImg} />
                    </button>
                    <div style={styles.galleryActions}>
                      <button
                        type="button"
                        style={styles.galleryActionBtn}
                        onClick={() => downloadFromUrl(item.url, imageFilename(item.prompt, item.url))}
                        title={t('image_studio.download', { defaultValue: 'Download' })}
                        aria-label={t('image_studio.download', { defaultValue: 'Download' })}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <path d="M7 10l5 5 5-5" />
                          <path d="M12 15V3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        style={styles.galleryActionBtn}
                        onClick={() => useAsReference(item)}
                        title={t('image_studio.use_as_reference', { defaultValue: 'Use as reference' })}
                        aria-label={t('image_studio.use_as_reference', { defaultValue: 'Use as reference' })}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 3h5v5" />
                          <path d="M21 3l-7 7" />
                          <path d="M8 21H3v-5" />
                          <path d="M3 21l7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        style={styles.galleryActionBtn}
                        onClick={() => reusePrompt(item)}
                        title={t('image_studio.reuse_prompt', { defaultValue: 'Reuse prompt + params' })}
                        aria-label={t('image_studio.reuse_prompt', { defaultValue: 'Reuse prompt + params' })}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12a9 9 0 0 1-15.6 6" />
                          <path d="M3 12a9 9 0 0 1 15.6-6" />
                          <path d="M19 2v4h-4" />
                          <path d="M5 22v-4h4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.galleryActionBtn, ...styles.galleryActionDanger }}
                        onClick={() => removeFromGallery(item.id)}
                        title={t('image_studio.remove', { defaultValue: 'Remove' })}
                        aria-label={t('image_studio.remove', { defaultValue: 'Remove' })}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                    <div style={styles.galleryFooter}>
                      <span style={styles.galleryPrompt} title={item.prompt}>{item.prompt}</span>
                      <span style={styles.galleryMeta}>{item.dimensions || item.size} · {item.model}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  layout: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    minHeight: 0,
    minWidth: 0,
    background: cssVar('bgDeep'),
    color: cssVar('text'),
    fontFamily: cssVar('fontSans'),
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: `1px solid ${cssVar('borderSubtle')}`,
    background: cssVar('bg'),
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  modeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: cssVar('radiusSm'),
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    fontSize: 12,
  },
  modePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: cssVar('radiusSm'),
    background: cssVar('bgHover'),
    color: cssVar('text'),
    fontSize: 12,
    fontWeight: 500,
  },
  balance: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 6,
  },
  balanceLabel: {
    fontSize: 11,
    color: cssVar('textTertiary'),
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: 500,
    color: cssVar('text'),
    fontVariantNumeric: 'tabular-nums',
  },
  body: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
    minWidth: 0,
  },
  params: {
    width: 280,
    minWidth: 260,
    flexShrink: 0,
    overflowY: 'auto',
    padding: '20px 18px',
    borderRight: `1px solid ${cssVar('borderSubtle')}`,
    background: cssVar('bg'),
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  paramSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  paramLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: cssVar('textTertiary'),
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  select: {
    appearance: 'none',
    width: '100%',
    padding: '8px 10px',
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: cssVar('radiusSm'),
    background: cssVar('bgSurface'),
    color: cssVar('text'),
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  modelMeta: {
    fontSize: 11,
    color: cssVar('textTertiary'),
  },
  segmented: {
    display: 'inline-flex',
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: cssVar('radiusSm'),
    padding: 2,
    background: cssVar('bgSurface'),
    gap: 2,
  },
  segmentedItem: {
    flex: 1,
    minWidth: 36,
    padding: '6px 10px',
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
    transition: cssVar('transition'),
  },
  segmentedItemActive: {
    background: cssVar('bgHover'),
    color: cssVar('text'),
    fontWeight: 500,
  },
  ratioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 4,
  },
  sizeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 4,
  },
  ratioBtn: {
    padding: '7px 4px',
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: 4,
    background: cssVar('bgSurface'),
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'inherit',
    transition: cssVar('transition'),
    fontVariantNumeric: 'tabular-nums',
  },
  ratioBtnActive: {
    background: cssVar('bgHover'),
    color: cssVar('text'),
    borderColor: cssVar('border'),
    fontWeight: 500,
  },
  sizePreview: {
    fontSize: 11,
    color: cssVar('textTertiary'),
    fontVariantNumeric: 'tabular-nums',
  },
  dropzone: {
    border: `1px dashed ${cssVar('borderSubtle')}`,
    borderRadius: cssVar('radiusSm'),
    padding: 12,
    background: cssVar('bgSurface'),
    cursor: 'pointer',
    minHeight: 72,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: cssVar('transition'),
  },
  dropzoneActive: {
    borderStyle: 'solid',
    borderColor: cssVar('border'),
  },
  dropzoneHint: {
    fontSize: 11,
    color: cssVar('textTertiary'),
    textAlign: 'center',
  },
  referenceList: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  referenceItem: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: 6,
    overflow: 'hidden',
    background: cssVar('bgDeep'),
  },
  referenceThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  referenceRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    border: 'none',
    borderRadius: '50%',
    background: 'rgba(6,10,18,0.78)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: 1,
    padding: 0,
  },
  editHint: {
    fontSize: 11,
    color: cssVar('textTertiary'),
  },
  workspace: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: 24,
    gap: 18,
    overflowY: 'auto',
  },
  promptCard: {
    background: cssVar('bgSurface'),
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: cssVar('radiusMd'),
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  promptInput: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    color: cssVar('text'),
    fontFamily: 'inherit',
    fontSize: 14,
    lineHeight: 1.55,
    outline: 'none',
    resize: 'vertical',
    minHeight: 80,
  },
  promptActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  promptStatus: {
    fontSize: 12,
    color: cssVar('textTertiary'),
    minWidth: 0,
  },
  progressText: {
    fontVariantNumeric: 'tabular-nums',
  },
  hintText: {
    color: cssVar('textTertiary'),
  },
  generateBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '9px 14px',
    border: 'none',
    borderRadius: cssVar('radiusSm'),
    background: cssVar('text'),
    color: cssVar('bg'),
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: cssVar('transition'),
  },
  cancelBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '9px 14px',
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: cssVar('radiusSm'),
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    fontSize: 13,
  },
  errorBar: {
    fontSize: 12,
    color: cssVar('danger'),
    background: 'rgba(220, 38, 38, 0.08)',
    border: '1px solid rgba(220, 38, 38, 0.18)',
    borderRadius: cssVar('radiusSm'),
    padding: '8px 10px',
  },
  gallerySection: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  galleryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  galleryTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 500,
    color: cssVar('text'),
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 8,
  },
  galleryCount: {
    fontSize: 11,
    color: cssVar('textTertiary'),
    fontVariantNumeric: 'tabular-nums',
  },
  clearBtn: {
    background: 'transparent',
    border: 'none',
    color: cssVar('textTertiary'),
    fontSize: 12,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
  },
  galleryEmpty: {
    flex: 1,
    minHeight: 220,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    color: cssVar('textTertiary'),
    border: `1px dashed ${cssVar('borderSubtle')}`,
    borderRadius: cssVar('radiusMd'),
    background: cssVar('bg'),
  },
  galleryEmptyIcon: {
    color: cssVar('textTertiary'),
    opacity: 0.5,
  },
  galleryEmptyText: {
    fontSize: 12,
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 14,
  },
  galleryCard: {
    position: 'relative',
    background: cssVar('bgSurface'),
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: cssVar('radiusSm'),
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  galleryThumb: {
    border: 'none',
    padding: 0,
    margin: 0,
    background: cssVar('bgDeep'),
    cursor: 'zoom-in',
    display: 'block',
    width: '100%',
    aspectRatio: '1 / 1',
    overflow: 'hidden',
  },
  galleryImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  galleryActions: {
    display: 'flex',
    gap: 4,
    padding: '6px 8px',
    borderTop: `1px solid ${cssVar('borderSubtle')}`,
    background: cssVar('bg'),
  },
  galleryActionBtn: {
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: cssVar('transition'),
  },
  galleryActionDanger: {
    marginLeft: 'auto',
  },
  galleryFooter: {
    padding: '8px 10px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  galleryPrompt: {
    fontSize: 12,
    color: cssVar('text'),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  galleryMeta: {
    fontSize: 11,
    color: cssVar('textTertiary'),
    fontVariantNumeric: 'tabular-nums',
  },
  previewOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(6, 10, 18, 0.78)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: 24,
  },
  previewModal: {
    position: 'relative',
    maxWidth: '90vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  previewImage: {
    maxWidth: '88vw',
    maxHeight: '78vh',
    borderRadius: cssVar('radiusSm'),
    boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
  },
  previewMeta: {
    display: 'flex',
    gap: 8,
    color: '#e6e8ee',
    fontSize: 12,
  },
  previewMetaLabel: {
    padding: '3px 8px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    fontVariantNumeric: 'tabular-nums',
  },
  previewClose: {
    position: 'absolute',
    top: -36,
    right: 0,
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 18,
    lineHeight: 1,
  },
};

// Suppress unused-warning for fileToDataURL — exported for potential future use
void fileToDataURL;
