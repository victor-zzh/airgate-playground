import {
  useRef,
  useState,
  useCallback,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { cssVar } from '@doudou-start/airgate-theme';
import { useStudio } from '../StudioContext';
import { CustomSelect } from '../CustomSelect';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NormalizedRect {
  x: number; // 0–1
  y: number; // 0–1
  width: number;  // 0–1
  height: number; // 0–1
}

interface DragState {
  startX: number;
  startY: number;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: cssVar('textTertiary'),
    textTransform: 'uppercase',
    marginBottom: 4,
    display: 'block',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  uploadArea: {
    border: `2px dashed ${cssVar('border')}`,
    borderRadius: 10,
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    background: cssVar('bgDeep'),
    transition: 'border-color 0.12s, background 0.12s',
    minHeight: 90,
  },
  uploadAreaDragging: {
    border: `2px dashed ${cssVar('primary')}`,
    borderRadius: 10,
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    background: cssVar('primarySubtle'),
    transition: 'border-color 0.12s, background 0.12s',
    minHeight: 90,
  },
  uploadIcon: {
    opacity: 0.4,
  },
  uploadHint: {
    fontSize: 12,
    color: cssVar('textTertiary'),
    textAlign: 'center',
  },
  canvasContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    border: `1px solid ${cssVar('border')}`,
    cursor: 'crosshair',
    userSelect: 'none',
  },
  sourceImg: {
    display: 'block',
    width: '100%',
    height: 'auto',
    maxHeight: 200,
    objectFit: 'contain',
    pointerEvents: 'none',
  },
  selectionRect: {
    position: 'absolute',
    border: '2px dashed rgba(99,102,241,0.9)',
    background: 'rgba(99,102,241,0.12)',
    boxSizing: 'border-box',
    pointerEvents: 'none',
  },
  canvasActions: {
    display: 'flex',
    gap: 6,
    marginTop: 4,
  },
  clearSelBtn: {
    padding: '5px 10px',
    border: `1px solid ${cssVar('border')}`,
    borderRadius: 7,
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
    transition: 'background 0.12s',
  },
  removeImgBtn: {
    padding: '5px 10px',
    border: `1px solid ${cssVar('border')}`,
    borderRadius: 7,
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
    transition: 'background 0.12s',
  },
  selectionHint: {
    fontSize: 11,
    color: cssVar('textTertiary'),
    marginTop: 2,
  },
  promptTextarea: {
    width: '100%',
    minHeight: 72,
    maxHeight: 140,
    padding: '10px 12px',
    border: `1px solid ${cssVar('border')}`,
    borderRadius: 8,
    background: cssVar('bgDeep'),
    color: cssVar('text'),
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.5,
    boxSizing: 'border-box',
    transition: 'border-color 0.12s',
  },
  select: {
    width: '100%',
    padding: '7px 10px',
    border: `1px solid ${cssVar('border')}`,
    borderRadius: 8,
    background: cssVar('bgDeep'),
    color: cssVar('text'),
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 28,
    boxSizing: 'border-box',
  },
  generateBtn: {
    width: '100%',
    padding: '10px 0',
    border: 'none',
    borderRadius: 9,
    background: cssVar('primary'),
    color: cssVar('textInverse'),
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'opacity 0.12s',
    marginTop: 4,
  },
  generateBtnDisabled: {
    width: '100%',
    padding: '10px 0',
    border: `1px solid ${cssVar('border')}`,
    borderRadius: 9,
    background: cssVar('bgSurface'),
    color: cssVar('textTertiary'),
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'not-allowed',
    opacity: 0.6,
    marginTop: 4,
  },
};

// ── Constants ─────────────────────────────────────────────────────────────────

const SIZE_OPTIONS = [
  { value: 'auto',      label: 'Auto' },
  { value: '1024x1024', label: '1024×1024' },
  { value: '1536x1024', label: '1536×1024' },
  { value: '1024x1536', label: '1024×1536' },
  { value: '2048x2048', label: '2048×2048' },
  { value: '2048x1152', label: '2048×1152' },
  { value: '1152x2048', label: '1152×2048' },
  { value: '3840x2160', label: '3840×2160 (4K)' },
  { value: '2160x3840', label: '2160×3840 (4K)' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function normalizeRect(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  containerW: number,
  containerH: number,
): NormalizedRect {
  const x = Math.min(startX, endX) / containerW;
  const y = Math.min(startY, endY) / containerH;
  const w = Math.abs(endX - startX) / containerW;
  const h = Math.abs(endY - startY) / containerH;
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
    width:  Math.max(0, Math.min(1, w)),
    height: Math.max(0, Math.min(1, h)),
  };
}

// ── InpaintPanel ──────────────────────────────────────────────────────────────

export function InpaintPanel() {
  const { t } = useTranslation();
  const {
    selectedModel,
    setSelectedModel,
    imageSize,
    setImageSize,
    imageModels,
    isGenerating,
    generate,
  } = useStudio();

  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selection, setSelection] = useState<NormalizedRect | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [liveRect, setLiveRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const canGenerate = prompt.trim().length > 0 && sourceImage !== null;

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      setSourceImage(dataUrl);
      setSelection(null);
    } catch {
      // ignore
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  };

  const handleDropzoneDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDropzoneDragLeave = () => setIsDragging(false);
  const handleDropzoneDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  // ── Selection rectangle drag ───────────────────────────────────────────────

  const getRelativePos = useCallback((e: ReactMouseEvent): { x: number; y: number } | null => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!sourceImage) return;
    const pos = getRelativePos(e);
    if (!pos) return;
    e.preventDefault();
    setDragState({ startX: pos.x, startY: pos.y });
    setLiveRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setSelection(null);
  }, [sourceImage, getRelativePos]);

  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const pos = getRelativePos(e);
    if (!pos) return;
    const el = containerRef.current;
    if (!el) return;
    setLiveRect({
      x: Math.min(dragState.startX, pos.x),
      y: Math.min(dragState.startY, pos.y),
      w: Math.abs(pos.x - dragState.startX),
      h: Math.abs(pos.y - dragState.startY),
    });
  }, [dragState, getRelativePos]);

  const handleMouseUp = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const pos = getRelativePos(e);
    const el = containerRef.current;
    if (!pos || !el) {
      setDragState(null);
      setLiveRect(null);
      return;
    }
    const { width, height } = el.getBoundingClientRect();
    const norm = normalizeRect(dragState.startX, dragState.startY, pos.x, pos.y, width, height);
    if (norm.width > 0.01 && norm.height > 0.01) {
      setSelection(norm);
    }
    setDragState(null);
    setLiveRect(null);
  }, [dragState, getRelativePos]);

  // ── Render selection overlay ───────────────────────────────────────────────

  const renderSelectionOverlay = () => {
    const rect = liveRect
      ? { x: liveRect.x, y: liveRect.y, width: liveRect.w, height: liveRect.h }
      : selection
        ? (() => {
            const el = containerRef.current;
            if (!el) return null;
            const { width, height } = el.getBoundingClientRect();
            return {
              x: selection.x * width,
              y: selection.y * height,
              width: selection.width * width,
              height: selection.height * height,
            };
          })()
        : null;

    if (!rect || (rect.width < 2 && rect.height < 2)) return null;

    return (
      <div
        style={{
          ...s.selectionRect,
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
        }}
      />
    );
  };

  // ── Generate ───────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    if (!canGenerate || !sourceImage) return;
    void generate(prompt, {
      sourceImage,
      maskRegion: selection ?? undefined,
    });
  };

  return (
    <div style={s.panel}>
      {/* Upload / canvas area */}
      <div style={s.row}>
        <label style={s.label}>
          {t('playground.studio_source_image', { defaultValue: '参考图片' })}
        </label>

        {sourceImage ? (
          <>
            <div
              ref={containerRef}
              style={s.canvasContainer}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img src={sourceImage} alt="source" style={s.sourceImg} />
              {renderSelectionOverlay()}
            </div>

            <div style={s.canvasActions}>
              <button
                type="button"
                style={s.clearSelBtn}
                onClick={() => setSelection(null)}
              >
                {t('playground.studio_clear_selection', { defaultValue: '清除选区' })}
              </button>
              <button
                type="button"
                style={s.removeImgBtn}
                onClick={() => { setSourceImage(null); setSelection(null); }}
              >
                {t('playground.studio_remove_image', { defaultValue: '移除图片' })}
              </button>
            </div>

            <div style={s.selectionHint}>
              {selection
                ? t('playground.studio_selection_set', { defaultValue: '已选定修改区域，拖拽可重新选择' })
                : t('playground.studio_selection_hint', { defaultValue: '在图片上拖拽选择要修改的区域' })}
            </div>
          </>
        ) : (
          <div
            style={isDragging ? s.uploadAreaDragging : s.uploadArea}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDropzoneDragOver}
            onDragLeave={handleDropzoneDragLeave}
            onDrop={handleDropzoneDrop}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          >
            <span style={s.uploadIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </span>
            <span style={s.uploadHint}>
              {t('playground.studio_upload_hint', { defaultValue: '点击上传或拖拽图片到此处' })}
            </span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
      </div>

      {/* Prompt */}
      <div style={s.row}>
        <label style={s.label}>
          {t('playground.studio_prompt', { defaultValue: '提示词' })}
        </label>
        <textarea
          style={s.promptTextarea}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={t('playground.studio_inpaint_placeholder', { defaultValue: '描述要修改的区域...' })}
          rows={3}
        />
      </div>

      {/* Model */}
      <div style={s.row}>
        <label style={s.label}>
          {t('playground.studio_model', { defaultValue: '模型' })}
        </label>
        <CustomSelect
          value={selectedModel}
          options={imageModels.length === 0
            ? [{ value: '', label: t('playground.studio_no_models', { defaultValue: '暂无可用模型' }) }]
            : imageModels.map(m => ({ value: m.platform ? `${m.platform}::${m.id}` : m.id, label: m.name || m.id }))}
          onChange={setSelectedModel}
        />
      </div>

      {/* Size */}
      <div style={s.row}>
        <label style={s.label}>
          {t('playground.studio_size', { defaultValue: '尺寸' })}
        </label>
        <CustomSelect
          value={imageSize}
          options={SIZE_OPTIONS}
          onChange={setImageSize}
        />
      </div>

      {/* Generate */}
      <button
        type="button"
        style={canGenerate ? s.generateBtn : s.generateBtnDisabled}
        disabled={!canGenerate}
        onClick={handleGenerate}
      >
        {isGenerating
          ? t('playground.studio_generating', { defaultValue: '生成中...' })
          : t('playground.studio_generate', { defaultValue: '生成' })}
      </button>
    </div>
  );
}
