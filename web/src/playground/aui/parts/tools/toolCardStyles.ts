import type { CSSProperties } from 'react';
import { cssVar } from '@doudou-start/airgate-theme';

// 工具卡片统一样式（web_search / generate_document / fallback 共用）。
export const toolCardStyles: Record<string, CSSProperties> = {
  card: {
    margin: '6px 0',
    padding: '8px 10px',
    borderRadius: 10,
    background: cssVar('bgDeep'),
    border: `1px solid ${cssVar('borderSubtle')}`,
    fontSize: 12.5,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: cssVar('textSecondary'),
  },
  icon: {
    display: 'inline-flex',
    color: cssVar('textTertiary'),
  },
  title: {
    fontWeight: 600,
    color: cssVar('text'),
  },
  subtle: {
    marginTop: 4,
    color: cssVar('textTertiary'),
    fontSize: 11.5,
    wordBreak: 'break-word',
  },
  spinner: {
    width: 11,
    height: 11,
    borderRadius: '50%',
    border: `1.5px solid ${cssVar('borderSubtle')}`,
    borderTopColor: cssVar('primary'),
    animation: 'pg-spin 0.8s linear infinite',
  },
  sourceList: {
    margin: '6px 0 0',
    padding: '0 0 0 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  sourceItem: {
    fontSize: 12,
    lineHeight: 1.5,
  },
  sourceLink: {
    textDecoration: 'none',
    wordBreak: 'break-word',
  },
  fileCard: {
    marginTop: 8,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    padding: '8px 12px',
    borderRadius: 9,
    border: '1px solid transparent',
    background: cssVar('bgElevated'),
    textDecoration: 'none',
    maxWidth: '100%',
  },
  fileIcon: {
    display: 'inline-flex',
    flexShrink: 0,
  },
  fileMeta: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  fileName: {
    fontWeight: 600,
    color: cssVar('text'),
    fontSize: 12.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fileSize: {
    color: cssVar('textTertiary'),
    fontSize: 11,
    fontFamily: cssVar('fontMono'),
  },
};
