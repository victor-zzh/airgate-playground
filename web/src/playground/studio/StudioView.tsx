import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cssVar } from '@doudou-start/airgate-theme';
import { StudioProvider, useStudio } from './StudioContext';
import { ImageModule } from './image/ImageModule';
import { GalleryView } from './GalleryView';

// ── Inline styles (fallback when studioStyles is not available) ─────────────

const ss: Record<string, CSSProperties> = {
  layout: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: cssVar('bgDeep'),
    color: cssVar('text'),
    fontFamily: cssVar('fontSans'),
  },
  sidebar: {
    width: 300,
    minWidth: 300,
    display: 'flex',
    flexDirection: 'column',
    background: cssVar('bg'),
    borderRight: `1px solid ${cssVar('borderSubtle')}`,
    overflow: 'hidden',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '18px 16px 10px',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: cssVar('text'),
  },
  sidebarScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 10px 16px',
  },
  mediaTypeGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginBottom: 4,
  },
  mediaTypeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 10px',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'background 0.12s, color 0.12s',
  },
  mediaTypeBtnActive: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 10px',
    border: 'none',
    borderRadius: 8,
    background: cssVar('primarySubtle'),
    color: cssVar('primary'),
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    fontWeight: 500,
    textAlign: 'left',
    transition: 'background 0.12s, color 0.12s',
  },
  mediaTypeBtnDisabled: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 10px',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: cssVar('textTertiary'),
    cursor: 'not-allowed',
    fontSize: 13,
    fontFamily: 'inherit',
    textAlign: 'left',
    opacity: 0.6,
  },
  comingSoonBadge: {
    marginLeft: 'auto',
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 4,
    background: cssVar('bgDeep'),
    color: cssVar('textTertiary'),
    letterSpacing: '0.03em',
  },
  sectionDivider: {
    height: 1,
    margin: '8px 0',
    background: cssVar('borderSubtle'),
    flexShrink: 0,
  },
  advancedLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    padding: '8px 10px',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
    textAlign: 'left',
    marginTop: 4,
    transition: 'background 0.12s, color 0.12s',
  },
  galleryArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  quickInputWrapper: {
    padding: '10px 16px 14px',
    borderTop: `1px solid ${cssVar('borderSubtle')}`,
    background: cssVar('bg'),
    flexShrink: 0,
  },
  quickInputRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
  },
  quickInputMeta: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
    fontSize: 11,
    color: cssVar('textTertiary'),
  },
  quickInputMetaBadge: {
    padding: '2px 6px',
    borderRadius: 4,
    background: cssVar('bgDeep'),
    fontSize: 11,
    color: cssVar('textSecondary'),
  },
  quickTextarea: {
    flex: 1,
    minHeight: 60,
    maxHeight: 140,
    padding: '10px 12px',
    border: `1px solid ${cssVar('border')}`,
    borderRadius: 10,
    background: cssVar('bgDeep'),
    color: cssVar('text'),
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.5,
    transition: 'border-color 0.12s',
  },
  quickSendBtn: {
    flexShrink: 0,
    width: 36,
    height: 36,
    border: 'none',
    borderRadius: 8,
    background: cssVar('primary'),
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.12s',
  },
  quickSendBtnDisabled: {
    flexShrink: 0,
    width: 36,
    height: 36,
    border: 'none',
    borderRadius: 8,
    background: cssVar('bgDeep'),
    color: cssVar('textTertiary'),
    cursor: 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
};

// ── QuickInput ────────────────────────────────────────────────────────────────

function QuickInput() {
  const { t } = useTranslation();
  const { isGenerating, generate, selectedModel, selectedModelId, imageSize } = useStudio();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = text.trim().length > 0 && !isGenerating;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;
    void generate(trimmed);
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={ss.quickInputWrapper}>
      <div style={ss.quickInputMeta}>
        {selectedModelId && (
          <span style={ss.quickInputMetaBadge}>{selectedModelId}</span>
        )}
        {imageSize && imageSize !== 'auto' && (
          <span style={ss.quickInputMetaBadge}>{imageSize}</span>
        )}
        <span>{t('playground.studio_quick_hint', { defaultValue: 'Enter 发送 · Shift+Enter 换行' })}</span>
      </div>
      <div style={ss.quickInputRow}>
        <textarea
          ref={textareaRef}
          style={ss.quickTextarea}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('playground.studio_quick_placeholder', { defaultValue: '快速生成一张图片...' })}
          rows={2}
          disabled={isGenerating}
        />
        <button
          type="button"
          style={canSend ? ss.quickSendBtn : ss.quickSendBtnDisabled}
          onClick={handleSend}
          disabled={!canSend}
          title={t('playground.studio_generate', { defaultValue: '生成' })}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Mobile styles ────────────────────────────────────────────────────────────

const mobileStyles: Record<string, CSSProperties> = {
  layout: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: cssVar('bgDeep'),
    color: cssVar('text'),
    fontFamily: cssVar('fontSans'),
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    background: cssVar('bg'),
    borderBottom: `1px solid ${cssVar('borderSubtle')}`,
    overflowX: 'auto',
    flexShrink: 0,
  },
  topBarPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    border: 'none',
    borderRadius: 16,
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'background 0.12s, color 0.12s',
  },
  topBarPillActive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    border: 'none',
    borderRadius: 16,
    background: cssVar('primarySubtle'),
    color: cssVar('primary'),
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'background 0.12s, color 0.12s',
  },
  topBarPillDisabled: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    border: 'none',
    borderRadius: 16,
    background: 'transparent',
    color: cssVar('textTertiary'),
    cursor: 'not-allowed',
    fontSize: 12,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    opacity: 0.6,
  },
  panelSection: {
    padding: '12px',
    borderBottom: `1px solid ${cssVar('borderSubtle')}`,
    background: cssVar('bg'),
    overflowY: 'auto',
    maxHeight: 320,
    flexShrink: 0,
  },
  panelToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: cssVar('bg'),
    borderBottom: `1px solid ${cssVar('borderSubtle')}`,
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    color: cssVar('textSecondary'),
    fontSize: 12,
    fontFamily: 'inherit',
    fontWeight: 600,
    flexShrink: 0,
  },
  galleryArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
};

// ── StudioLayout ─────────────────────────────────────────────────────────────

function StudioLayout() {
  const { t } = useTranslation();
  const { mediaType, setMediaType } = useStudio();

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [panelExpanded, setPanelExpanded] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (isMobile) {
    return (
      <div style={mobileStyles.layout}>
        {/* Top media type pills */}
        <div style={mobileStyles.topBar}>
          <button
            type="button"
            style={mediaType === 'image' ? mobileStyles.topBarPillActive : mobileStyles.topBarPill}
            onClick={() => setMediaType('image')}
          >
            <span>🖼️</span>
            {t('playground.studio_media_image', { defaultValue: '图片' })}
          </button>
          <button
            type="button"
            style={mobileStyles.topBarPillDisabled}
            disabled
          >
            <span>🎬</span>
            {t('playground.studio_media_video', { defaultValue: '视频' })}
          </button>
          <button
            type="button"
            style={mobileStyles.topBarPillDisabled}
            disabled
          >
            <span>🎵</span>
            {t('playground.studio_media_music', { defaultValue: '音乐' })}
          </button>
        </div>

        {/* Collapsible panel toggle */}
        <button
          type="button"
          style={mobileStyles.panelToggle}
          onClick={() => setPanelExpanded(!panelExpanded)}
        >
          <span>{t('playground.studio_settings', { defaultValue: '设置面板' })}</span>
          <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: panelExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            &#9662;
          </span>
        </button>

        {/* Collapsible panel content */}
        {panelExpanded && (
          <div style={mobileStyles.panelSection}>
            {mediaType === 'image' && <ImageModule />}
          </div>
        )}

        {/* Gallery full width below */}
        <div style={mobileStyles.galleryArea}>
          <GalleryView />
          <QuickInput />
        </div>
      </div>
    );
  }

  return (
    <div style={ss.layout}>
      {/* Left gallery */}
      <div style={ss.galleryArea}>
        <GalleryView />
        <QuickInput />
      </div>

      {/* Right sidebar */}
      <div style={{ ...ss.sidebar, borderRight: 'none', borderLeft: `1px solid var(--ag-color-borderSubtle, #1e293b)` }}>
        <div style={ss.sidebarHeader}>
          {t('playground.studio_title', { defaultValue: '创作中心' })}
        </div>

        <div style={ss.sidebarScroll}>
          {/* Media type selector */}
          <div style={ss.mediaTypeGroup}>
            <button
              type="button"
              style={mediaType === 'image' ? ss.mediaTypeBtnActive : ss.mediaTypeBtn}
              onClick={() => setMediaType('image')}
            >
              <span>🖼️</span>
              {t('playground.studio_media_image', { defaultValue: '图片' })}
            </button>
            <button
              type="button"
              style={ss.mediaTypeBtnDisabled}
              disabled
            >
              <span>🎬</span>
              {t('playground.studio_media_video', { defaultValue: '视频' })}
              <span style={ss.comingSoonBadge}>{t('playground.studio_coming_soon', { defaultValue: '即将推出' })}</span>
            </button>
            <button
              type="button"
              style={ss.mediaTypeBtnDisabled}
              disabled
            >
              <span>🎵</span>
              {t('playground.studio_media_music', { defaultValue: '音乐' })}
              <span style={ss.comingSoonBadge}>{t('playground.studio_coming_soon', { defaultValue: '即将推出' })}</span>
            </button>
          </div>

          <div style={ss.sectionDivider} />

          {/* Mode-specific panel */}
          {mediaType === 'image' && <ImageModule />}

          {/* Advanced workflow link — hidden until ready */}
        </div>
      </div>
    </div>
  );
}

// ── StudioView (entry point) ──────────────────────────────────────────────────

export function StudioView() {
  return (
    <StudioProvider>
      <StudioLayout />
    </StudioProvider>
  );
}
