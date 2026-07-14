// web_search 工具卡：搜索中状态 + 完成后引用列表（链接走站内安全策略同款）。
import type { ToolCallMessagePartComponent } from '@assistant-ui/react';
import { useTranslation } from 'react-i18next';
import { cssVar } from '@doudou-start/airgate-theme';
import { toolCardStyles } from './toolCardStyles';

interface SearchSource {
  index?: number;
  title?: string;
  url?: string;
  snippet?: string;
}

export const WebSearchTool: ToolCallMessagePartComponent = ({ args, result, status }) => {
  const { t } = useTranslation();
  const query = args && typeof args === 'object' ? (args as { query?: string }).query : undefined;
  const running = status?.type === 'running';
  const sources = (result && typeof result === 'object' ? (result as { sources?: SearchSource[] }).sources : undefined) ?? [];

  return (
    <div style={toolCardStyles.card}>
      <div style={toolCardStyles.header}>
        <span style={toolCardStyles.icon} aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
        </span>
        <span style={toolCardStyles.title}>
          {running
            ? t('playground.tool_searching', { defaultValue: 'Searching the web…' })
            : t('playground.tool_search_results', { defaultValue: 'Web search', count: sources.length })}
        </span>
        {running && <span style={toolCardStyles.spinner} aria-hidden="true" />}
      </div>
      {query && <div style={toolCardStyles.subtle}>{query}</div>}
      {!running && sources.length > 0 && (
        <ol style={toolCardStyles.sourceList}>
          {sources.map((source, i) => (
            <li key={source.url ?? i} style={toolCardStyles.sourceItem}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={{ ...toolCardStyles.sourceLink, color: cssVar('primary') }}
                title={source.snippet}
              >
                {source.title || source.url}
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
