import type { CSSProperties } from 'react';
import { cssVar } from '@doudou-start/airgate-theme';

const PLAYGROUND_COMPOSER_TEXTAREA_HEIGHT = 112;

export const keyframes = `
@keyframes pg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@keyframes pg-fadein {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pg-spin {
  to { transform: rotate(360deg); }
}

/* ── Quiet Modern aesthetic ──
   单一字体（系统 Chinese ladder + 现代 sans for Latin），多权重撑层级，
   完全跟随 SDK 主题色系。没有任何复古/编辑级装饰。 */
[data-pg-aesthetic] {
  font-feature-settings: 'cv11' on, 'ss01' on;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 删除按钮：hover 才显出，颜色保持中性，hover 时才染 danger */
.pg-conv-delete {
  opacity: 0;
  color: var(--ag-text-tertiary, #9ca3af);
  transition: opacity 120ms ease, background 120ms ease, color 120ms ease;
}
.pg-conv-item:hover .pg-conv-delete,
.pg-conv-item:focus-within .pg-conv-delete {
  opacity: 1;
}
.pg-conv-delete:hover {
  background: var(--ag-danger-subtle, rgba(239, 68, 68, 0.12));
  color: var(--ag-danger, #ef4444);
}
.pg-conv-delete:focus-visible {
  opacity: 1;
  outline: 2px solid var(--ag-border-focus, #3b82f6);
  outline-offset: 1px;
}

.pg-conv-item {
  position: relative;
}
.pg-conv-item:hover,
.pg-sidebar-action:hover,
.pg-sidebar-link:hover {
  background: var(--ag-bg-hover, rgba(148, 163, 184, 0.12)) !important;
  color: var(--ag-text, #111827) !important;
}
.pg-conv-item.is-active {
  background: var(--ag-bg-hover, rgba(148, 163, 184, 0.12)) !important;
}
.pg-sidebar-action:focus-visible,
.pg-sidebar-link:focus-visible {
  outline: 2px solid var(--ag-border-focus, #3b82f6);
  outline-offset: 2px;
}
.pg-sidebar-collapse-button svg {
  stroke-width: 2.5;
}
.pg-sidebar-collapse-button:hover {
  background: var(--ag-bg-hover, rgba(148, 163, 184, 0.12)) !important;
  color: var(--ag-text, #111827) !important;
}
.pg-topbar-button:hover {
  background: var(--ag-bg-hover, rgba(148, 163, 184, 0.12)) !important;
  color: var(--ag-text, #111827) !important;
}
.pg-topbar-button:focus-visible {
  outline: 2px solid var(--ag-border-focus, #3b82f6);
  outline-offset: 2px;
}
.pg-topbar-logout:hover {
  background: var(--ag-danger-subtle, rgba(239, 68, 68, 0.12)) !important;
  color: var(--ag-danger, #ef4444) !important;
}
.pg-topbar {
  background: color-mix(in oklab, var(--ag-bg, #f8fafc) 78%, transparent) !important;
}
[data-theme="dark"] .pg-topbar,
.dark .pg-topbar {
  background: color-mix(in oklab, var(--ag-bg, #0f172a) 82%, transparent) !important;
  border-bottom-color: color-mix(in oklab, var(--ag-border, rgba(148, 163, 184, 0.18)) 34%, transparent) !important;
  box-shadow:
    0 1px 0 color-mix(in oklab, white 4%, transparent) inset,
    0 4px 16px color-mix(in oklab, black 10%, transparent) !important;
}
@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  .pg-topbar {
    background: color-mix(in oklab, var(--ag-bg-surface, #ffffff) 92%, transparent) !important;
  }
}
.pg-input-wrapper:focus-within {
  border-color: color-mix(in oklab, var(--ag-primary, #2dd4bf) 35%, transparent) !important;
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.18),
    0 2px 12px rgba(0, 0, 0, 0.08),
    0 0 0 1px color-mix(in oklab, var(--ag-primary, #2dd4bf) 12%, transparent) !important;
}
.pg-composer-select:hover {
  border-color: var(--ag-border, rgba(148, 163, 184, 0.26)) !important;
  color: var(--ag-text, #111827) !important;
}
.pg-composer-select:focus-visible {
  border-color: color-mix(in oklab, var(--ag-primary, #2dd4bf) 38%, transparent) !important;
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--ag-primary, #2dd4bf) 14%, transparent);
}
.pg-composer-select option {
  background: var(--ag-bg-surface, #ffffff);
  color: var(--ag-text, #111827);
}
@media (max-width: 720px) {
  .pg-topbar-user-text,
  .pg-topbar-lang-text {
    display: none !important;
  }
}
`;

export const styles: Record<string, CSSProperties> = {
  layout: {
    display: 'flex',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    position: 'relative',
    isolation: 'isolate',
    background: cssVar('bgDeep'),
    fontFamily: cssVar('fontSans'),
    color: cssVar('text'),
    overflow: 'hidden',
  },
  // ── Sidebar ──
  sidebar: {
    width: 284,
    minWidth: 284,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    background: cssVar('bgDeep'),
    borderRight: `1px solid ${cssVar('borderSubtle')}`,
    position: 'relative',
    zIndex: 3,
    fontSynthesis: 'none',
    textRendering: 'geometricPrecision',
  },
  sidebarRail: {
    width: 48,
    minWidth: 48,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 4,
    background: cssVar('bgDeep'),
    borderRight: `1px solid ${cssVar('borderSubtle')}`,
    flexShrink: 0,
    zIndex: 3,
  },
  sidebarRailMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    background: 'transparent',
    borderRight: 'none',
    zIndex: 4,
  },
  sidebarBackdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(6, 10, 18, 0.64)',
    zIndex: 25,
  },
  sidebarMobile: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 'min(84vw, 320px)',
    minWidth: 'min(84vw, 320px)',
    boxShadow: '0 18px 48px rgba(0, 0, 0, 0.32)',
    zIndex: 30,
  },
  sidebarHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 2,
    padding: '0 12px 10px',
  },
  sidebarTopbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
    height: 48,
  },
  breadcrumbs: {
    display: 'inline-flex',
    alignItems: 'center',
    minWidth: 0,
    gap: 7,
  },
  breadcrumbItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },
  breadcrumbLink: {
    display: 'inline-flex',
    alignItems: 'center',
    minWidth: 0,
    padding: '4px 10px',
    borderRadius: 8,
    color: cssVar('textTertiary'),
    fontFamily: cssVar('fontSans'),
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: 0,
    textDecoration: 'none',
    transition: cssVar('transition'),
  },
  breadcrumbCurrent: {
    color: cssVar('text'),
    fontFamily: cssVar('fontSans'),
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  breadcrumbSeparator: {
    color: cssVar('textTertiary'),
    flexShrink: 0,
    fontSize: 15,
    opacity: 0.45,
  },
  newBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    minWidth: 0,
    minHeight: 36,
    gap: 12,
    padding: '0 10px',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: cssVar('text'),
    cursor: 'pointer',
    transition: cssVar('transition'),
    flexShrink: 0,
    fontFamily: cssVar('fontSans'),
    fontSize: 15,
    fontWeight: 400,
    lineHeight: '20px',
    letterSpacing: 0,
  },
  newBtnIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    flexShrink: 0,
  },
  convList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 12px 12px',
  },
  convItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 36,
    padding: '7px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: cssVar('transition'),
    marginBottom: 4,
    color: cssVar('text'),
  },
  convItemActive: {
    background: cssVar('bgHover'),
    fontWeight: 500,
  },
  convIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    flexShrink: 0,
    transition: cssVar('transition'),
  },
  convTitle: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 15,
    lineHeight: '20px',
    letterSpacing: 0,
  },
  deleteBtn: {
    width: 22,
    height: 22,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
    marginTop: 0,
  },
  emptyConvList: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '32px 16px',
    color: cssVar('textTertiary'),
    fontSize: 12,
  },
  balanceBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    margin: '8px 12px 12px',
    padding: '12px 10px 0',
    borderTop: `1px solid ${cssVar('borderSubtle')}`,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: cssVar('textTertiary'),
    letterSpacing: '0.02em',
  },
  balanceValue: {
    fontSize: 12,
    fontWeight: 500,
    color: cssVar('text'),
    fontVariantNumeric: 'tabular-nums',
  },

  // ── Main ──
  main: {
    position: 'relative' as const,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
  },
  topbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    gap: 12,
    padding: '0 16px',
    borderBottom: `1px solid color-mix(in oklab, ${cssVar('border')} 28%, transparent)`,
    boxShadow: `0 1px 0 color-mix(in oklab, white 16%, transparent) inset, 0 4px 16px color-mix(in oklab, ${cssVar('bg')} 10%, transparent)`,
    backdropFilter: 'saturate(160%) blur(16px)',
    WebkitBackdropFilter: 'saturate(160%) blur(16px)',
    pointerEvents: 'auto',
  },
  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  topbarTextBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
    padding: '0 12px',
    border: 'none',
    borderRadius: cssVar('radiusSm'),
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    transition: cssVar('transition'),
    fontFamily: cssVar('fontSans'),
    fontSize: 12,
    fontWeight: 500,
  },
  topbarLangText: {
    width: 32,
    textAlign: 'center' as const,
    fontFamily: cssVar('fontMono'),
    fontSize: 12,
    textTransform: 'uppercase',
  },
  topbarIconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    minWidth: 40,
    height: 40,
    border: 'none',
    borderRadius: cssVar('radiusSm'),
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    transition: cssVar('transition'),
  },
  topbarLogoutBtn: {
    color: cssVar('textSecondary'),
  },
  topbarDivider: {
    width: 1,
    height: 24,
    margin: '0 4px',
    background: cssVar('border'),
    flexShrink: 0,
  },
  topbarUser: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  topbarUserText: {
    display: 'block',
    minWidth: 0,
    textAlign: 'right' as const,
  },
  topbarUserName: {
    color: cssVar('text'),
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.2,
    maxWidth: 140,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  topbarUserEmail: {
    color: cssVar('textTertiary'),
    fontSize: 12,
    lineHeight: 1.2,
    maxWidth: 160,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  topbarAvatar: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: cssVar('radiusSm'),
    color: cssVar('primary'),
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  },
  topbarAdminAvatar: {
    fontWeight: 500,
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    minWidth: 40,
    height: 40,
    border: 'none',
    borderRadius: cssVar('radiusSm'),
    background: 'transparent',
    color: cssVar('textSecondary'),
    cursor: 'pointer',
    transition: cssVar('transition'),
    flexShrink: 0,
  },
  // 模型和 reasoning 选择器嵌在输入卡片内，保持透明底，避免控件层级过重。
  selectors: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
  },
  selectorsMobile: {
    width: '100%',
    gap: 4,
    rowGap: 2,
    flexWrap: 'wrap',
  },
  selectTrigger: {
    display: 'block',
    width: 'auto',
    maxWidth: '100%',
    height: 28,
    padding: '0 28px 0 10px',
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: 7,
    backgroundColor: cssVar('bgHover'),
    backgroundImage: 'linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)',
    backgroundPosition: 'calc(100% - 13px) 50%, calc(100% - 8px) 50%',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '5px 5px, 5px 5px',
    color: cssVar('textSecondary'),
    fontFamily: cssVar('fontMono'),
    fontSize: 11,
    fontWeight: 600,
    lineHeight: '26px',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    cursor: 'pointer',
    transition: cssVar('transition'),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
  },
  // ── Messages ──
  messagesArea: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    paddingTop: 48,
  },

  // ── Empty state ──
  // 居中、克制、靠层级与留白说话。一个标题、一个描述、一个 primary CTA。
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 14,
    padding: '40px 32px',
    maxWidth: 480,
    margin: '0 auto',
    width: '100%',
    textAlign: 'center',
    animation: 'pg-fadein 0.4s ease-out',
  },
  emptyStateMobile: {
    padding: '32px 24px',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: 500,
    color: cssVar('text'),
    lineHeight: 1.18,
    letterSpacing: '-0.018em',
    margin: 0,
  },
  emptyDesc: {
    fontSize: 14,
    color: cssVar('textTertiary'),
    lineHeight: 1.55,
    margin: 0,
  },
  emptyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 20px',
    border: 'none',
    borderRadius: 999,
    background: cssVar('primary'),
    color: cssVar('textInverse'),
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: cssVar('transition'),
    marginTop: 12,
  },

  // ── Message row ──
  // ChatGPT 风格：用户消息右对齐圆角气泡（bgSurface），助手消息左对齐无气泡纯
  // 排版。两侧都不显示 avatar 和"你/助手"role label。借助 padding 拉空气，
  // 取消行间分割线。整列居中、限定 768px 宽，营造窄列阅读体验。
  messageRow: {
    display: 'flex',
    width: '100%',
    maxWidth: 768,
    margin: '0 auto',
    padding: '14px 24px',
  },
  messageRowMobile: {
    padding: '10px 14px',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  userBubble: {
    maxWidth: '78%',
    minWidth: 0,
    padding: '11px 16px',
    borderRadius: 18,
    background: cssVar('bgSurface'),
    border: `1px solid ${cssVar('borderSubtle')}`,
  },
  userBubbleMobile: {
    maxWidth: '82%',
    padding: '10px 13px',
    borderRadius: 16,
  },
  assistantBlock: {
    maxWidth: '100%',
    width: '100%',
    minWidth: 0,
  },
  messageCopyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: '999px',
    background: 'transparent',
    color: cssVar('textTertiary'),
    cursor: 'pointer',
    transition: cssVar('transition'),
  },
  messageCopyAfterText: {
    display: 'inline-flex',
    verticalAlign: 'text-bottom',
    marginLeft: 6,
    opacity: 0,
    pointerEvents: 'none',
    transform: 'translateY(1px)',
    transition: cssVar('transition'),
  },
  messageCopyAfterTextVisible: {
    opacity: 1,
    pointerEvents: 'auto',
  },
  messageCopyAfterTextBtn: {
    width: 22,
    height: 22,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 1.72,
    wordBreak: 'break-word',
    color: cssVar('text'),
  },
  markdownParagraph: {
    margin: '0 0 11px',
  },
  markdownH1: {
    margin: '4px 0 14px',
    fontSize: 22,
    fontWeight: 600,
    lineHeight: 1.25,
    letterSpacing: '-0.015em',
    color: cssVar('text'),
  },
  markdownH2: {
    margin: '18px 0 10px',
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    color: cssVar('text'),
  },
  markdownH3: {
    margin: '16px 0 8px',
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.35,
    color: cssVar('text'),
  },
  markdownH4: {
    margin: '14px 0 8px',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.4,
    color: cssVar('text'),
  },
  markdownList: {
    margin: '0 0 12px',
    paddingLeft: 20,
    color: cssVar('text'),
  },
  markdownListItem: {
    margin: '4px 0',
  },
  markdownBlockquote: {
    margin: '0 0 12px',
    padding: '9px 13px',
    borderLeft: `3px solid ${cssVar('primary')}`,
    borderRadius: '0 10px 10px 0',
    background: cssVar('primarySubtle'),
    color: cssVar('textSecondary'),
  },
  markdownCodeBlock: {
    margin: '4px 0 14px',
    padding: '13px 15px',
    borderRadius: cssVar('radiusSm'),
    background: cssVar('bgDeep'),
    border: `1px solid ${cssVar('borderSubtle')}`,
    color: cssVar('text'),
    fontFamily: cssVar('fontMono'),
    fontSize: 12.5,
    lineHeight: 1.72,
    overflowX: 'auto',
    whiteSpace: 'pre',
  },
  markdownInlineCode: {
    padding: '1px 5px 2px',
    borderRadius: 6,
    background: cssVar('bgSurface'),
    border: `1px solid ${cssVar('borderSubtle')}`,
    color: cssVar('primary'),
    fontFamily: cssVar('fontMono'),
    fontSize: '0.9em',
  },
  markdownInlineMath: {
    display: 'inline-block',
    maxWidth: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
    verticalAlign: '-0.18em',
  },
  markdownBlockMath: {
    margin: '4px 0 14px',
    padding: '12px 14px',
    borderRadius: cssVar('radiusSm'),
    background: cssVar('bgSurface'),
    border: `1px solid ${cssVar('borderSubtle')}`,
    color: cssVar('text'),
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  markdownLink: {
    color: cssVar('primary'),
    textDecoration: 'underline',
    textDecorationColor: cssVar('primary'),
    textUnderlineOffset: 3,
  },
  markdownDivider: {
    height: 1,
    border: 0,
    background: cssVar('border'),
    margin: '16px 0',
  },
  reasoningBox: {
    marginBottom: 10,
    padding: '10px 12px',
    borderRadius: cssVar('radiusSm'),
    background: cssVar('bgSurface'),
    border: `1px solid ${cssVar('borderSubtle')}`,
  },
  reasoningSummary: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    fontWeight: 600,
    color: cssVar('textSecondary'),
    userSelect: 'none',
  },
  reasoningContent: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.6,
    wordBreak: 'break-word',
    color: cssVar('textSecondary'),
  },
  imageGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 12,
    maxWidth: '100%',
    margin: '10px 0 6px',
  },
  imageGroupMobile: {
    gap: 8,
    marginTop: 8,
  },
  generatedImageFrame: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    flex: '1 1 180px',
    maxWidth: 'min(100%, 320px)',
    minWidth: 0,
  },
  generatedImageFrameMobile: {
    flex: '1 1 140px',
    maxWidth: 'min(100%, 240px)',
  },
  generatedImagePreviewBtn: {
    display: 'block',
    width: '100%',
    padding: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'zoom-in',
    textAlign: 'left',
    font: 'inherit',
  },
  generatedImageDimensions: {
    display: 'block',
    marginTop: 4,
    fontSize: 11,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    color: cssVar('textTertiary'),
    textAlign: 'center' as const,
  },
  generatedImage: {
    display: 'block',
    maxHeight: 420,
    width: '100%',
    height: 'auto',
    borderRadius: cssVar('radiusMd'),
    border: `1px solid ${cssVar('borderSubtle')}`,
    objectFit: 'contain',
  },
  imagePreviewOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'rgba(4, 7, 13, 0.78)',
    backdropFilter: 'blur(10px)',
  },
  imagePreviewModal: {
    position: 'relative',
    display: 'flex',
    maxWidth: 'min(94vw, 1120px)',
    maxHeight: '90vh',
    width: 'fit-content',
    borderRadius: cssVar('radiusLg'),
    border: `1px solid ${cssVar('border')}`,
    background: cssVar('bgDeep'),
    boxShadow: '0 28px 90px rgba(0, 0, 0, 0.45)',
    overflow: 'hidden',
  },
  imagePreviewNavBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    border: `1px solid ${cssVar('glassBorder')}`,
    borderRadius: '999px',
    background: cssVar('glass'),
    color: cssVar('text'),
    fontSize: 34,
    lineHeight: 1,
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    boxShadow: cssVar('shadowMd'),
  },
  imagePreviewCounter: {
    position: 'absolute',
    left: '50%',
    bottom: 12,
    transform: 'translateX(-50%)',
    padding: '5px 10px',
    borderRadius: '999px',
    border: `1px solid ${cssVar('glassBorder')}`,
    background: cssVar('glass'),
    color: cssVar('textSecondary'),
    fontSize: 12,
    backdropFilter: 'blur(10px)',
    boxShadow: cssVar('shadowMd'),
  },
  imagePreviewCloseBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    border: `1px solid ${cssVar('glassBorder')}`,
    borderRadius: '999px',
    background: cssVar('glass'),
    color: cssVar('text'),
    fontSize: 22,
    lineHeight: 1,
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    boxShadow: cssVar('shadowMd'),
  },
  imagePreviewLarge: {
    display: 'block',
    maxWidth: 'min(94vw, 1120px)',
    maxHeight: '90vh',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    background: cssVar('bgDeep'),
  },
  interactionNotice: {
    position: 'sticky',
    bottom: 12,
    alignSelf: 'center',
    zIndex: 4,
    padding: '7px 12px',
    borderRadius: '999px',
    background: cssVar('bgElevated'),
    border: `1px solid ${cssVar('borderSubtle')}`,
    color: cssVar('textSecondary'),
    fontSize: 12,
    boxShadow: cssVar('shadowMd'),
  },
  messageMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    fontSize: 11,
    color: cssVar('textTertiary'),
  },
  metaBadge: {
    display: 'inline-flex',
    padding: '2px 8px',
    borderRadius: '999px',
    background: cssVar('bgSurface'),
    border: `1px solid ${cssVar('borderSubtle')}`,
    fontSize: 11,
    fontFamily: cssVar('fontMono'),
    color: cssVar('textSecondary'),
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: cssVar('primary'),
    animation: 'pg-pulse 1.2s ease-in-out infinite',
  },
  thinkingDots: {
    animation: 'pg-pulse 1.5s ease-in-out infinite',
  },

  // ── Error ──
  errorBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '8px 28px',
    padding: '10px 14px',
    borderRadius: cssVar('radiusSm'),
    background: cssVar('dangerSubtle'),
    color: cssVar('danger'),
    fontSize: 13,
    border: `1px solid ${cssVar('danger')}`,
    borderColor: 'rgba(251, 113, 133, 0.2)',
  },
  errorBarMobile: {
    margin: '8px 14px',
  },
  errorMessage: {
    flex: 1,
    minWidth: 0,
  },
  recoverableBar: {
    background: cssVar('primarySubtle'),
    color: cssVar('primary'),
    borderColor: 'rgba(45, 212, 191, 0.22)',
  },
  errorRetryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    borderRadius: '999px',
    border: '1px solid rgba(251, 113, 133, 0.28)',
    background: 'rgba(251, 113, 133, 0.1)',
    color: cssVar('danger'),
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: cssVar('fontSans'),
  },
  recoverableRetryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    borderRadius: '999px',
    border: '1px solid rgba(45, 212, 191, 0.3)',
    background: 'rgba(45, 212, 191, 0.12)',
    color: cssVar('primary'),
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: cssVar('fontSans'),
  },

  // ── Input ──
  inputArea: {
    padding: '12px 28px 20px',
    background: 'transparent',
    flexShrink: 0,
  },
  inputAreaMobile: {
    padding: '8px 10px 10px',
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    border: `1px solid ${cssVar('glassBorder')}`,
    borderRadius: 20,
    background: cssVar('bgElevated'),
    paddingTop: 6,
    paddingRight: 6,
    paddingBottom: 10,
    paddingLeft: 6,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 12px rgba(0, 0, 0, 0.08)',
    transition: 'box-shadow 0.3s, border-color 0.15s',
    width: '100%',
    maxWidth: 768,
    margin: '0 auto',
  },
  inputWrapperMobile: {
    borderRadius: 20,
    paddingTop: 6,
    paddingRight: 6,
    paddingBottom: 8,
    paddingLeft: 6,
  },
  inputWrapperStreaming: {
    borderColor: cssVar('borderSubtle'),
  },
  imagePreviewList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '6px 12px 2px',
  },
  imagePreviewItem: {
    position: 'relative',
    width: 76,
    height: 76,
    padding: 0,
    borderRadius: cssVar('radiusSm'),
    overflow: 'hidden',
    border: `1px solid ${cssVar('borderSubtle')}`,
    background: cssVar('bgHover'),
    cursor: 'pointer',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    border: `1px solid ${cssVar('glassBorder')}`,
    borderRadius: 999,
    background: cssVar('glass'),
    color: cssVar('text'),
    cursor: 'pointer',
    lineHeight: '20px',
    padding: 0,
    fontSize: 16,
  },
  textarea: {
    width: '100%',
    height: PLAYGROUND_COMPOSER_TEXTAREA_HEIGHT,
    minHeight: PLAYGROUND_COMPOSER_TEXTAREA_HEIGHT,
    maxHeight: PLAYGROUND_COMPOSER_TEXTAREA_HEIGHT,
    padding: '8px 14px',
    border: 'none',
    background: 'transparent',
    color: cssVar('text'),
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.6,
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  inputActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    padding: '2px 8px 0',
  },
  inputActionsMobile: {
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: 7,
  },
  inputButtonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  inputButtonGroupMobile: {
    width: '100%',
    minWidth: 0,
    justifyContent: 'space-between',
    gap: 6,
  },
  fileInput: {
    display: 'none',
  },
  attachBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 28,
    padding: '0 10px',
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: 7,
    background: cssVar('bgHover'),
    color: cssVar('textSecondary'),
    fontSize: 11,
    fontWeight: 600,
    lineHeight: '26px',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    cursor: 'pointer',
    transition: cssVar('transition'),
  },
  thinkingToggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 28,
    padding: '0 10px',
    border: `1px solid ${cssVar('borderSubtle')}`,
    borderRadius: 7,
    background: cssVar('bgHover'),
    color: cssVar('textSecondary'),
    fontSize: 11,
    fontWeight: 600,
    lineHeight: '26px',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    cursor: 'pointer',
    transition: cssVar('transition'),
  },
  thinkingToggleBtnActive: {
    background: cssVar('primarySubtle'),
    borderColor: `color-mix(in oklab, ${cssVar('primary')} 38%, transparent)`,
    color: cssVar('primary'),
  },
  sendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 28,
    padding: '0 12px',
    border: `1px solid color-mix(in oklab, ${cssVar('primary')} 45%, transparent)`,
    borderRadius: 7,
    background: cssVar('primary'),
    color: cssVar('textInverse'),
    fontSize: 12,
    fontWeight: 600,
    lineHeight: '26px',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    cursor: 'pointer',
    transition: cssVar('transition'),
  },
  stopBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 28,
    padding: '0 12px',
    border: `1px solid color-mix(in oklab, ${cssVar('danger')} 35%, transparent)`,
    borderRadius: 7,
    background: cssVar('dangerSubtle'),
    color: cssVar('danger'),
    fontSize: 12,
    fontWeight: 600,
    lineHeight: '26px',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  actionBtnMobile: {
    flex: '0 1 auto',
    minWidth: 44,
    minHeight: 36,
    justifyContent: 'center',
    padding: '8px 11px',
  },
};
