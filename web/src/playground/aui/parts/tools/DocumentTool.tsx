// generate_document 工具卡：生成中状态 + 完成后文件卡片（名称/大小/下载）。
import type { ToolCallMessagePartComponent } from '@assistant-ui/react';
import { useTranslation } from 'react-i18next';
import { cssVar } from '@doudou-start/airgate-theme';
import { toolCardStyles } from './toolCardStyles';

interface DocFile {
  name?: string;
  content_type?: string;
  size?: number;
  src?: string;
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const DocumentTool: ToolCallMessagePartComponent = ({ args, result, status }) => {
  const { t } = useTranslation();
  const title = args && typeof args === 'object' ? (args as { title?: string }).title : undefined;
  const running = status?.type === 'running';
  const file = result && typeof result === 'object' ? (result as { file?: DocFile }).file : undefined;

  return (
    <div style={toolCardStyles.card}>
      <div style={toolCardStyles.header}>
        <span style={toolCardStyles.icon} aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
          </svg>
        </span>
        <span style={toolCardStyles.title}>
          {running
            ? t('playground.tool_generating_document', { defaultValue: 'Generating document…' })
            : t('playground.tool_document_ready', { defaultValue: 'Document ready' })}
        </span>
        {running && <span style={toolCardStyles.spinner} aria-hidden="true" />}
      </div>
      {running && title && <div style={toolCardStyles.subtle}>{title}</div>}
      {!running && file?.src && (
        <a
          href={file.src}
          download={file.name}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...toolCardStyles.fileCard, borderColor: cssVar('borderSubtle') }}
        >
          <span style={{ ...toolCardStyles.fileIcon, color: cssVar('primary') }} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </span>
          <span style={toolCardStyles.fileMeta}>
            <span style={toolCardStyles.fileName}>{file.name}</span>
            <span style={toolCardStyles.fileSize}>{formatSize(file.size)}</span>
          </span>
        </a>
      )}
    </div>
  );
};
