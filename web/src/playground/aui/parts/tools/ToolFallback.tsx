// 通用工具卡：未注册专属渲染器的工具（未来新增工具的兜底展示）。
import type { ToolCallMessagePartComponent } from '@assistant-ui/react';
import { useTranslation } from 'react-i18next';
import { toolCardStyles } from './toolCardStyles';

export const ToolFallback: ToolCallMessagePartComponent = ({ toolName, status, isError }) => {
  const { t } = useTranslation();
  const running = status?.type === 'running';
  return (
    <div style={toolCardStyles.card}>
      <div style={toolCardStyles.header}>
        <span style={toolCardStyles.icon} aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6a2 2 0 1 0 2.8 2.8l6-6a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.1-2.1z" />
          </svg>
        </span>
        <span style={toolCardStyles.title}>
          {running
            ? t('playground.tool_running', { defaultValue: 'Running {{tool}}…', tool: toolName })
            : isError
              ? t('playground.tool_failed', { defaultValue: '{{tool}} failed', tool: toolName })
              : t('playground.tool_done', { defaultValue: '{{tool}} done', tool: toolName })}
        </span>
        {running && <span style={toolCardStyles.spinner} aria-hidden="true" />}
      </div>
    </div>
  );
};
