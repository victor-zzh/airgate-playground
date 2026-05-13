import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { cssVar } from '@doudou-start/airgate-theme';
import type { ImageMode } from '../types';
import { useStudio } from '../StudioContext';
import { TextToImagePanel } from './TextToImagePanel';
import { ImageToImagePanel } from './ImageToImagePanel';
import { InpaintPanel } from './InpaintPanel';
import { BatchPanel } from './BatchPanel';

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  tabBar: {
    display: 'flex',
    gap: 2,
    padding: '2px',
    background: cssVar('bgDeep'),
    borderRadius: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  tab: {
    flex: '1 1 auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 6px',
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
    transition: 'background 0.12s, color 0.12s',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    flex: '1 1 auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 6px',
    border: 'none',
    borderRadius: 6,
    background: cssVar('bg'),
    color: cssVar('text'),
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
    fontWeight: 600,
    transition: 'background 0.12s, color 0.12s',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface TabDef {
  mode: ImageMode;
  labelKey: string;
  defaultLabel: string;
}

const TABS: TabDef[] = [
  { mode: 'text2img', labelKey: 'playground.studio_mode_text2img', defaultLabel: '文生图' },
  { mode: 'img2img',  labelKey: 'playground.studio_mode_img2img',  defaultLabel: '图生图' },
  { mode: 'inpaint',  labelKey: 'playground.studio_mode_inpaint',  defaultLabel: '局部绘图' },
  { mode: 'batch',    labelKey: 'playground.studio_mode_batch',     defaultLabel: '批量' },
];

// ── ImageModule ───────────────────────────────────────────────────────────────

export function ImageModule() {
  const { t } = useTranslation();
  const { imageMode, setImageMode } = useStudio();

  return (
    <>
      {/* Mode tabs */}
      <div style={s.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.mode}
            type="button"
            style={imageMode === tab.mode ? s.tabActive : s.tab}
            onClick={() => setImageMode(tab.mode)}
          >
            {t(tab.labelKey, { defaultValue: tab.defaultLabel })}
          </button>
        ))}
      </div>

      {/* Active panel */}
      {imageMode === 'text2img' && <TextToImagePanel />}
      {imageMode === 'img2img'  && <ImageToImagePanel />}
      {imageMode === 'inpaint'  && <InpaintPanel />}
      {imageMode === 'batch'    && <BatchPanel />}
    </>
  );
}
