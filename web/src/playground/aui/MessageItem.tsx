// 单条消息渲染：用户右对齐气泡 / 助手左对齐纯排版，观感与旧 ChatView 完全一致。
// parts 渲染交给 MessagePrimitive.Parts（Text/Reasoning 两类，Phase 4 工具 part
// 在此处扩展 components 即可）；消息 meta（模型徽标/流式指示）从 metadata.custom 读。
import { MessagePrimitive, useMessage } from '@assistant-ui/react';
import { useState } from 'react';
import { cssVar } from '@doudou-start/airgate-theme';
import { usePlayground } from '../PlaygroundContext';
import { api } from '../../api';
import { styles } from '../styles';
import { TextPart } from './parts/TextPart';
import { ReasoningPart } from './parts/ReasoningPart';
import { WebSearchTool } from './parts/tools/WebSearchTool';
import { DocumentTool } from './parts/tools/DocumentTool';
import { ToolFallback } from './parts/tools/ToolFallback';

const PART_COMPONENTS = {
  Text: TextPart,
  Reasoning: ReasoningPart,
  tools: {
    by_name: {
      web_search: WebSearchTool,
      generate_document: DocumentTool,
      generate_spreadsheet: DocumentTool,
      generate_presentation: DocumentTool,
    },
    Fallback: ToolFallback,
  },
};

function formatCost(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '$0';
  if (value < 0.000001) return '<$0.000001';
  return `$${value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}`;
}

export function MessageItem() {
  const { t, isMobile, thinkingVisible } = usePlayground();
  const isUser = useMessage(s => s.role === 'user');
  const custom = useMessage(s => s.metadata.custom as Record<string, unknown> | undefined);
  const hasText = useMessage(s => s.content.some(part => part.type === 'text' && Boolean(part.text)));
  const hasReasoning = useMessage(s => s.content.some(part => part.type === 'reasoning' && Boolean(part.text)));
  const hasTools = useMessage(s => s.content.some(part => part.type === 'tool-call'));
  const hasFileTool = useMessage(s => s.content.some(part => (
    part.type === 'tool-call' && ['generate_document', 'generate_spreadsheet', 'generate_presentation'].includes(part.toolName)
  )));

  const isStreamingDraft = Boolean(custom?.streaming);
  const model = typeof custom?.model === 'string' ? custom.model : '';
  const inputTokens = Number(custom?.input_tokens) || 0;
  const outputTokens = Number(custom?.output_tokens) || 0;
  const totalCost = Math.max(0, Number(custom?.cost) || 0);
  const renderFee = Math.min(totalCost, Math.max(0, Number(custom?.render_fee) || 0));
  const modelCost = Math.max(0, totalCost - renderFee);
  const messageID = Number(useMessage(s => s.id));
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportNotice, setExportNotice] = useState('');

  const exportMessage = async (format: 'pdf' | 'docx' | 'pptx' | 'xlsx') => {
    if (!Number.isSafeInteger(messageID) || messageID <= 0 || exporting) return;
    setExporting(true);
    setExportError('');
    setExportNotice('');
    try {
      const result = await api.exportMessage(messageID, format);
      const link = document.createElement('a');
      link.href = result.file.src;
      link.download = result.file.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      setExportOpen(false);
      setExportNotice(t('playground.direct_export_usage', {
        modelTokens: result.model_tokens,
        renderFee: formatCost(result.render_fee),
      }));
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <MessagePrimitive.Root
      style={{
        ...styles.messageRow,
        ...(isMobile ? styles.messageRowMobile : null),
        ...(isUser ? styles.messageRowUser : styles.messageRowAssistant),
      }}
    >
      <div style={isUser ? { ...styles.userBubble, ...(isMobile ? styles.userBubbleMobile : null) } : styles.assistantBlock}>
        <MessagePrimitive.Parts components={PART_COMPONENTS} />

        {/* 流式尚无正文时的"思考中"占位（有可见思维链或工具卡时不显示） */}
        {!isUser && isStreamingDraft && !hasText && !hasTools && (!hasReasoning || !thinkingVisible) && (
          <div style={{ ...styles.messageContent, opacity: 0.5 }}>
            <span style={styles.thinkingDots}>{t('playground.thinking')}</span>
          </div>
        )}

        {!isUser && (isStreamingDraft ? (
          hasText && (
            <div style={styles.messageMeta}>
              <span style={styles.streamingDot} />
              <span>{t('playground.streaming')}</span>
            </div>
          )
        ) : (
          (model || inputTokens > 0 || outputTokens > 0 || totalCost > 0 || hasFileTool) && (
            <div style={styles.messageMeta}>
			  {model && <span style={styles.metaBadge}>{model}</span>}
			  {(inputTokens > 0 || outputTokens > 0) && (
				<span>{t('playground.tokens_in')} {inputTokens} · {t('playground.tokens_out')} {outputTokens}</span>
			  )}
			  {hasFileTool ? (
				<>
				  <span>{t('playground.model_cost')} {formatCost(modelCost)}</span>
				  <span>{t('playground.file_render_fee')} {formatCost(renderFee)}</span>
				  <span>{t('playground.total_cost')} {formatCost(totalCost)}</span>
				</>
			  ) : totalCost > 0 ? (
				<span>{t('playground.cost')} {formatCost(totalCost)}</span>
			  ) : null}
            </div>
          )
        ))}

        {!isUser && !isStreamingDraft && hasText && Number.isSafeInteger(messageID) && messageID > 0 && (
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button
              type="button"
              className="pg-msg-export"
              onClick={() => { setExportOpen(value => !value); setExportError(''); setExportNotice(''); }}
              disabled={exporting}
              title={t('playground.export_message', { defaultValue: 'Export message' })}
              aria-label={t('playground.export_message', { defaultValue: 'Export message' })}
              aria-expanded={exportOpen}
              style={{
                width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${cssVar('borderSubtle')}`, borderRadius: 6, background: 'transparent',
                color: cssVar('textTertiary'), cursor: exporting ? 'wait' : 'pointer', opacity: exporting ? 0.55 : 0.82,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
              </svg>
            </button>
            {exportOpen && (
              <div role="menu" style={{
                position: 'absolute', right: 0, bottom: 34, zIndex: 5, display: 'flex', gap: 4,
                padding: 5, border: `1px solid ${cssVar('borderSubtle')}`, borderRadius: 7,
                background: cssVar('bgSurface'), boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
              }}>
                {([
                  ['pdf', 'PDF'], ['docx', 'Word'], ['pptx', 'PPT'], ['xlsx', 'Excel'],
                ] as const).map(([format, label]) => (
                  <button
                    key={format}
                    type="button"
                    role="menuitem"
                    onClick={() => void exportMessage(format)}
                    title={label}
                    style={{
                      minWidth: 48, height: 28, padding: '0 7px', border: `1px solid ${cssVar('borderSubtle')}`,
                      borderRadius: 5, background: cssVar('bgDeep'), color: cssVar('text'), cursor: 'pointer',
                      fontSize: 11, fontWeight: 600, letterSpacing: 0,
                    }}
                  >{label}</button>
                ))}
              </div>
            )}
            {exportError && <span role="alert" style={{ position: 'absolute', right: 0, top: 32, color: cssVar('danger'), fontSize: 11, whiteSpace: 'nowrap' }}>{exportError}</span>}
            {exportNotice && <span role="status" style={{ position: 'absolute', right: 34, top: 5, color: cssVar('textTertiary'), fontSize: 11, whiteSpace: 'nowrap' }}>{exportNotice}</span>}
          </div>
        )}
      </div>
    </MessagePrimitive.Root>
  );
}
