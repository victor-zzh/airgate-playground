import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { cssVar } from '@doudou-start/airgate-theme';
import { useStudio } from '../StudioContext';
import { CustomSelect } from '../CustomSelect';

const s: Record<string, CSSProperties> = {
  panel: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: cssVar('textTertiary'), textTransform: 'uppercase', marginBottom: 4, display: 'block' },
  row: { display: 'flex', flexDirection: 'column', gap: 4 },
  tabRow: { display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: `1px solid ${cssVar('border')}` },
  tab: { flex: 1, padding: '7px 0', border: 'none', background: 'transparent', color: cssVar('textSecondary'), fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' },
  tabActive: { flex: 1, padding: '7px 0', border: 'none', background: cssVar('bgHover'), color: cssVar('text'), fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  textarea: { width: '100%', minHeight: 96, maxHeight: 200, padding: '10px 12px', border: `1px solid ${cssVar('border')}`, borderRadius: 8, background: cssVar('bgDeep'), color: cssVar('text'), fontSize: 12, fontFamily: 'inherit', resize: 'vertical' as const, outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' as const },
  hint: { fontSize: 11, color: cssVar('textTertiary'), marginTop: 2 },
  uploadArea: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 80, padding: 12, border: `2px dashed ${cssVar('border')}`, borderRadius: 10, cursor: 'pointer', color: cssVar('textTertiary'), fontSize: 12, textAlign: 'center' as const, transition: 'border-color 0.12s' },
  thumbGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 },
  thumb: { position: 'relative' as const, aspectRatio: '1', borderRadius: 6, overflow: 'hidden', border: `1px solid ${cssVar('borderSubtle')}` },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' },
  thumbRemove: { position: 'absolute' as const, top: 2, right: 2, width: 18, height: 18, border: 'none', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1 },
  generateBtn: { width: '100%', padding: '10px 0', border: 'none', borderRadius: 9, background: cssVar('primary'), color: cssVar('textInverse'), fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'opacity 0.12s', marginTop: 4 },
  generateBtnDisabled: { width: '100%', padding: '10px 0', border: `1px solid ${cssVar('border')}`, borderRadius: 9, background: cssVar('bgSurface'), color: cssVar('textTertiary'), fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'not-allowed', opacity: 0.6, marginTop: 4 },
};

const SIZE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: '1024x1024', label: '1024×1024' },
  { value: '1536x1024', label: '1536×1024' },
  { value: '1024x1536', label: '1024×1536' },
  { value: '2048x2048', label: '2048×2048' },
  { value: '2048x1152', label: '2048×1152' },
  { value: '1152x2048', label: '1152×2048' },
  { value: '3840x2160', label: '3840×2160 (4K)' },
  { value: '2160x3840', label: '2160×3840 (4K)' },
];

type BatchMode = 'multi_prompt' | 'multi_image';

export function BatchPanel() {
  const { t } = useTranslation();
  const { selectedModel, setSelectedModel, imageSize, setImageSize, imageModels, isGenerating, generate } = useStudio();

  const [mode, setMode] = useState<BatchMode>('multi_prompt');
  const [multiPrompts, setMultiPrompts] = useState('');
  const [images, setImages] = useState<Array<{ id: string; url: string; file: File }>>([]);
  const [imagePrompt, setImagePrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const promptLines = multiPrompts.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const canGenerate = (
    mode === 'multi_prompt' ? promptLines.length > 0 : (images.length > 0 && imagePrompt.trim().length > 0)
  );

  const addImages = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, { id: `${file.name}-${Date.now()}`, url: reader.result as string, file }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    if (mode === 'multi_prompt') {
      for (const line of promptLines) {
        void generate(line, { count: 1 });
      }
    } else {
      for (const img of images) {
        void generate(imagePrompt.trim(), { sourceImage: img.url });
      }
    }
  };

  const btnLabel = isGenerating
    ? t('playground.studio_generating', { defaultValue: '生成中...' })
    : mode === 'multi_prompt'
      ? `${t('playground.studio_batch_generate', { defaultValue: '批量生成' })} ${promptLines.length} ${t('playground.studio_batch_unit', { defaultValue: '张' })}`
      : `${t('playground.studio_batch_process', { defaultValue: '批量处理' })} ${images.length} ${t('playground.studio_batch_images', { defaultValue: '张图片' })}`;

  return (
    <div style={s.panel}>
      {/* Mode tabs */}
      <div style={s.tabRow}>
        <button type="button" style={mode === 'multi_prompt' ? s.tabActive : s.tab} onClick={() => setMode('multi_prompt')}>
          {t('playground.studio_batch_multi_prompt', { defaultValue: '多提示词' })}
        </button>
        <button type="button" style={mode === 'multi_image' ? s.tabActive : s.tab} onClick={() => setMode('multi_image')}>
          {t('playground.studio_batch_multi_image', { defaultValue: '多图片' })}
        </button>
      </div>

      {mode === 'multi_prompt' ? (
        <div style={s.row}>
          <label style={s.label}>{t('playground.studio_batch_prompts', { defaultValue: '批量提示词' })}</label>
          <textarea
            style={s.textarea}
            value={multiPrompts}
            onChange={e => setMultiPrompts(e.target.value)}
            placeholder={t('playground.studio_batch_placeholder', { defaultValue: '每行一个提示词...' })}
            rows={5}
          />
          <div style={s.hint}>
            {promptLines.length > 0 ? `共 ${promptLines.length} 个提示词` : t('playground.studio_batch_empty', { defaultValue: '尚未输入提示词' })}
          </div>
        </div>
      ) : (
        <>
          {/* Upload images */}
          <div style={s.row}>
            <label style={s.label}>{t('playground.studio_batch_upload', { defaultValue: '上传图片' })}</label>
            <div
              style={s.uploadArea}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addImages(e.dataTransfer.files); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
              {t('playground.studio_batch_add_images', { defaultValue: '点击或拖拽添加图片' })}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => addImages(e.target.files)} />
          </div>

          {/* Thumbnails */}
          {images.length > 0 && (
            <div style={s.thumbGrid}>
              {images.map(img => (
                <div key={img.id} style={s.thumb}>
                  <img src={img.url} alt="" style={s.thumbImg} />
                  <button type="button" style={s.thumbRemove} onClick={() => removeImage(img.id)}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* Shared prompt */}
          <div style={s.row}>
            <label style={s.label}>{t('playground.studio_batch_shared_prompt', { defaultValue: '统一提示词' })}</label>
            <textarea
              style={s.textarea}
              value={imagePrompt}
              onChange={e => setImagePrompt(e.target.value)}
              placeholder={t('playground.studio_batch_shared_placeholder', { defaultValue: '对所有图片应用相同的描述...' })}
              rows={3}
            />
          </div>
        </>
      )}

      {/* Model / Size */}
      <div style={s.row}>
        <label style={s.label}>{t('playground.studio_model', { defaultValue: '模型' })}</label>
        <CustomSelect
          value={selectedModel}
          options={imageModels.length === 0
            ? [{ value: '', label: t('playground.studio_no_models', { defaultValue: '暂无可用模型' }) }]
            : imageModels.map(m => ({ value: m.platform ? `${m.platform}::${m.id}` : m.id, label: m.name || m.id }))}
          onChange={setSelectedModel}
        />
      </div>
      <div style={s.row}>
        <label style={s.label}>{t('playground.studio_size', { defaultValue: '尺寸' })}</label>
        <CustomSelect value={imageSize} options={SIZE_OPTIONS} onChange={setImageSize} />
      </div>

      {/* Generate */}
      <button type="button" style={canGenerate ? s.generateBtn : s.generateBtnDisabled} disabled={!canGenerate} onClick={() => { void handleGenerate(); }}>
        {btnLabel}
      </button>
    </div>
  );
}
