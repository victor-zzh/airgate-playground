import { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { cssVar } from '@doudou-start/airgate-theme';
import { useStudio } from '../StudioContext';
import { CustomSelect } from '../CustomSelect';

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
  promptTextarea: {
    width: '100%',
    minHeight: 88,
    maxHeight: 200,
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
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
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
  countGroup: {
    display: 'flex',
    gap: 6,
  },
  countBtn: {
    flex: 1,
    padding: '6px 0',
    border: `1px solid ${cssVar('border')}`,
    borderRadius: 7,
    background: cssVar('bgDeep'),
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    transition: 'background 0.12s, color 0.12s, border-color 0.12s',
  },
  countBtnActive: {
    flex: 1,
    padding: '6px 0',
    border: `1px solid ${cssVar('primary')}`,
    borderRadius: 7,
    background: cssVar('primarySubtle'),
    color: cssVar('primary'),
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    fontWeight: 600,
    transition: 'background 0.12s, color 0.12s, border-color 0.12s',
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

const COUNT_OPTIONS = [1, 2, 3, 4];

// ── TextToImagePanel ──────────────────────────────────────────────────────────

export function TextToImagePanel() {
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
  const [count, setCount] = useState(1);

  const canGenerate = prompt.trim().length > 0;

  const handleGenerate = () => {
    const trimmed = prompt.trim();
    if (!trimmed || isGenerating) return;
    // Fire `count` generation calls sequentially
    const fireAll = async () => {
      for (let i = 0; i < count; i++) {
        generate(trimmed, { count: 1 });
      }
    };
    void fireAll();
  };

  return (
    <div style={s.panel}>
      {/* Prompt */}
      <div style={s.row}>
        <label style={s.label}>
          {t('playground.studio_prompt', { defaultValue: '提示词' })}
        </label>
        <textarea
          style={s.promptTextarea}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={t('playground.studio_prompt_placeholder', { defaultValue: '描述你想生成的图片...' })}
          rows={4}
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

      {/* Count */}
      <div style={s.row}>
        <label style={s.label}>
          {t('playground.studio_count', { defaultValue: '数量' })}
        </label>
        <div style={s.countGroup}>
          {COUNT_OPTIONS.map(n => (
            <button
              key={n}
              type="button"
              style={count === n ? s.countBtnActive : s.countBtn}
              onClick={() => setCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
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
