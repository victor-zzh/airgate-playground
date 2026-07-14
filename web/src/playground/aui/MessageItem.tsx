// 单条消息渲染：用户右对齐气泡 / 助手左对齐纯排版，观感与旧 ChatView 完全一致。
// parts 渲染交给 MessagePrimitive.Parts（Text/Reasoning 两类，Phase 4 工具 part
// 在此处扩展 components 即可）；消息 meta（模型徽标/流式指示）从 metadata.custom 读。
import { MessagePrimitive, useMessage } from '@assistant-ui/react';
import { usePlayground } from '../PlaygroundContext';
import { styles } from '../styles';
import { TextPart } from './parts/TextPart';
import { ReasoningPart } from './parts/ReasoningPart';

const PART_COMPONENTS = { Text: TextPart, Reasoning: ReasoningPart };

export function MessageItem() {
  const { t, isMobile, thinkingVisible } = usePlayground();
  const isUser = useMessage(s => s.role === 'user');
  const custom = useMessage(s => s.metadata.custom as Record<string, unknown> | undefined);
  const hasText = useMessage(s => s.content.some(part => part.type === 'text' && Boolean(part.text)));
  const hasReasoning = useMessage(s => s.content.some(part => part.type === 'reasoning' && Boolean(part.text)));

  const isStreamingDraft = Boolean(custom?.streaming);
  const model = typeof custom?.model === 'string' ? custom.model : '';

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

        {/* 流式尚无正文时的"思考中"占位（有可见思维链时不显示） */}
        {!isUser && isStreamingDraft && !hasText && (!hasReasoning || !thinkingVisible) && (
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
          model && (
            <div style={styles.messageMeta}>
              <span style={styles.metaBadge}>{model}</span>
            </div>
          )
        ))}
      </div>
    </MessagePrimitive.Root>
  );
}
