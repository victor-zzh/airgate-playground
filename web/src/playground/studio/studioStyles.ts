import type { CSSProperties } from 'react';
import { cssVar } from '@doudou-start/airgate-theme';

export const studioStyles: Record<string, CSSProperties> = {
  // ── Layout ────────────────────────────────────────────────────────────────

  layout: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: cssVar('bgDeep'),
    color: cssVar('text'),
    fontFamily: cssVar('fontSans'),
    position: 'relative',
  },

  // ── Sidebar ───────────────────────────────────────────────────────────────

  sidebar: {
    width: 320,
    minWidth: 320,
    maxWidth: 320,
    display: 'flex',
    flexDirection: 'column',
    background: cssVar('bg'),
    borderRight: `1px solid ${cssVar('borderSubtle')}`,
    overflowY: 'auto',
    overflowX: 'hidden',
    flexShrink: 0,
  },

  sidebarHeader: {
    padding: '16px 16px 10px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: cssVar('textTertiary'),
    fontFamily: cssVar('fontMono') || 'monospace',
    userSelect: 'none',
  },

  // ── Media type selector ───────────────────────────────────────────────────

  mediaTypeRow: {
    display: 'flex',
    gap: 6,
    padding: '0 12px 12px',
  },

  mediaTypeBtn: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 34,
    padding: '0 10px',
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: 8,
    background: 'transparent',
    color: cssVar('textSecondary'),
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.12s, color 0.12s, border-color 0.12s',
    whiteSpace: 'nowrap',
  },

  mediaTypeBtnActive: {
    background: cssVar('primarySubtle') || `${cssVar('primary')}18`,
    borderColor: cssVar('primary'),
    color: cssVar('primary'),
    fontWeight: 600,
  },

  mediaTypeBtnDisabled: {
    opacity: 0.38,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },

  // ── Mode tabs (text2img / img2img / inpaint / batch) ──────────────────────

  modeTabRow: {
    display: 'flex',
    gap: 2,
    padding: '0 12px 12px',
    flexWrap: 'wrap',
  },

  modeTab: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    padding: '0 12px',
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: cssVar('textTertiary'),
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.1s, color 0.1s',
    whiteSpace: 'nowrap',
  },

  modeTabActive: {
    background: cssVar('bgHover'),
    color: cssVar('text'),
    fontWeight: 700,
  },

  // ── Panel body ────────────────────────────────────────────────────────────

  panelBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '4px 12px 80px',
    overflowY: 'auto',
    overflowX: 'hidden',
  },

  // ── Form controls ─────────────────────────────────────────────────────────

  textarea: {
    width: '100%',
    minHeight: 96,
    maxHeight: 240,
    padding: '10px 12px',
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: 10,
    background: cssVar('bgDeep'),
    color: cssVar('text'),
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.55,
    boxSizing: 'border-box',
    transition: 'border-color 0.12s',
  },

  input: {
    width: '100%',
    height: 34,
    padding: '0 10px',
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: 8,
    background: cssVar('bgDeep'),
    color: cssVar('text'),
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.12s',
  },

  select: {
    width: '100%',
    height: 34,
    padding: '0 10px',
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: 8,
    background: cssVar('bgDeep'),
    color: cssVar('text'),
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.12s',
  },

  // ── Upload area ───────────────────────────────────────────────────────────

  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 100,
    padding: '16px 12px',
    border: `1.5px dashed ${cssVar('borderSubtle')}`,
    borderRadius: 10,
    background: cssVar('bgDeep'),
    color: cssVar('textTertiary'),
    fontSize: 12,
    cursor: 'pointer',
    transition: 'border-color 0.12s, background 0.12s',
    textAlign: 'center',
    userSelect: 'none',
  },

  uploadPreview: {
    position: 'relative',
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    background: cssVar('bgDeep'),
    border: `1px solid ${cssVar('borderSubtle')}`,
    aspectRatio: '1 / 1',
  },

  uploadPreviewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  // ── Generate button ───────────────────────────────────────────────────────

  generateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    width: '100%',
    height: 42,
    border: 'none',
    borderRadius: 10,
    background: cssVar('primary'),
    color: '#000',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.12s, transform 0.08s',
    letterSpacing: '0.01em',
    flexShrink: 0,
  },

  generateBtnDisabled: {
    opacity: 0.38,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },

  // ── Slider ────────────────────────────────────────────────────────────────

  slider: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },

  sliderLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: cssVar('textSecondary'),
    fontWeight: 500,
  },

  sliderInput: {
    width: '100%',
    cursor: 'pointer',
    accentColor: cssVar('primary'),
  },

  // ── Gallery (right pane) ──────────────────────────────────────────────────

  gallery: {
    flex: 1,
    minWidth: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '16px',
    background: cssVar('bgDeep'),
  },

  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
    alignContent: 'start',
  },

  galleryEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: '100%',
    minHeight: 240,
    color: cssVar('textTertiary'),
    fontSize: 13,
    textAlign: 'center',
    userSelect: 'none',
  },

  galleryCard: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    background: cssVar('bgElevated'),
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
    cursor: 'pointer',
    aspectRatio: '1 / 1',
    transition: 'box-shadow 0.15s, transform 0.12s',
  },

  galleryCardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  galleryCardOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.0) 50%)',
    opacity: 0,
    transition: 'opacity 0.18s',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '10px',
  },

  galleryCardPrompt: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 1.4,
    marginBottom: 6,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },

  galleryCardActions: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
  },

  galleryCardActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
    padding: '0 8px',
    border: 'none',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    backdropFilter: 'blur(4px)',
    transition: 'background 0.1s',
    whiteSpace: 'nowrap',
  },

  // ── Quick input bar (bottom) ──────────────────────────────────────────────

  quickInput: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(640px, calc(100% - 360px))',
    zIndex: 10,
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 14,
    background: cssVar('bgElevated'),
    border: `1px solid ${cssVar('border')}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
  },

  quickInputTextarea: {
    flex: 1,
    minHeight: 24,
    maxHeight: 120,
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: cssVar('text'),
    fontSize: 13,
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.5,
  },

  quickInputSendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    border: 'none',
    borderRadius: 9,
    background: cssVar('primary'),
    color: '#000',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
    transition: 'opacity 0.12s',
  },

  // ── Section divider ───────────────────────────────────────────────────────

  sectionDivider: {
    height: 1,
    margin: '4px 0',
    background: cssVar('borderSubtle'),
    flexShrink: 0,
  },

  // ── Advanced workflow link ─────────────────────────────────────────────────

  advancedLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '10px 16px 14px',
    fontSize: 11,
    fontWeight: 600,
    color: cssVar('textTertiary'),
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'color 0.12s',
    letterSpacing: '0.01em',
    userSelect: 'none',
  },

  // ── Badge ─────────────────────────────────────────────────────────────────

  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 16,
    padding: '0 5px',
    borderRadius: 4,
    background: cssVar('bgHover'),
    color: cssVar('textTertiary'),
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    flexShrink: 0,
    fontFamily: cssVar('fontMono') || 'monospace',
  },

  badgeProcessing: {
    background: `${cssVar('primary')}22`,
    color: cssVar('primary'),
  },

  badgeCompleted: {
    background: 'rgba(74, 222, 128, 0.15)',
    color: '#4ade80',
  },

  badgeFailed: {
    background: `${cssVar('danger')}22`,
    color: cssVar('danger'),
  },

  // ── Fullscreen preview overlay ────────────────────────────────────────────

  previewOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(0, 0, 0, 0.88)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  },

  previewOverlayImg: {
    maxWidth: 'min(90vw, 1200px)',
    maxHeight: '80vh',
    borderRadius: 12,
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
    objectFit: 'contain',
  },

  previewOverlayMeta: {
    marginTop: 14,
    padding: '10px 16px',
    borderRadius: 10,
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    maxWidth: 'min(90vw, 600px)',
    textAlign: 'center',
    lineHeight: 1.6,
  },

  previewOverlayActions: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
  },

  previewOverlayBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    padding: '0 16px',
    border: 'none',
    borderRadius: 9,
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    backdropFilter: 'blur(4px)',
    transition: 'background 0.12s',
  },

  previewOverlayClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    border: 'none',
    borderRadius: 9,
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.12s',
  },
};
