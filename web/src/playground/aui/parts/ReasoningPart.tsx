// reasoning part 渲染：原 ChatView 的 <details> 思维链盒原样迁入。
// thinkingVisible 门控、"复制思考"按钮（阻止 summary 展开切换）语义保持不变。
import type { ReasoningMessagePartProps } from '@assistant-ui/react';
import { usePlayground } from '../../PlaygroundContext';
import { renderMessageContent } from '../../MessageRendering';
import { styles } from '../../styles';
import { MessageCopyButton } from './MessageCopyButton';

export function ReasoningPart(props: ReasoningMessagePartProps) {
  const { t, thinkingVisible, interactiveMessageOptions } = usePlayground();
  if (!thinkingVisible || !props.text) return null;
  return (
    <details style={styles.reasoningBox} open>
      <summary style={styles.reasoningSummary}>
        <span>{t('playground.thinking_title')}</span>
        <MessageCopyButton content={props.text} label={t('playground.copy_thinking')} preventToggle />
      </summary>
      <div style={styles.reasoningContent}>
        {renderMessageContent(props.text, interactiveMessageOptions)}
      </div>
    </details>
  );
}
