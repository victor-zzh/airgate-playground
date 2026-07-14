// 消息复制按钮：沿用原 ChatView.renderCopyButton 的样式与 copyMessageContent 逻辑
// （handleMessageCopy 内部写 text/plain + text/html 双格式剪贴板）。
import type { CSSProperties } from 'react';
import { usePlayground } from '../../PlaygroundContext';
import { styles } from '../../styles';

export function MessageCopyButton({
  content,
  label = 'Copy message',
  preventToggle = false,
  buttonStyle,
}: {
  content: string;
  label?: string;
  preventToggle?: boolean;
  buttonStyle?: CSSProperties;
}) {
  const { handleMessageCopy } = usePlayground();
  return (
    <button
      type="button"
      className="pg-copy-btn"
      style={{ ...styles.messageCopyBtn, ...buttonStyle }}
      title={label}
      aria-label={label}
      onClick={(event) => {
        if (preventToggle) {
          event.preventDefault();
          event.stopPropagation();
        }
        handleMessageCopy(content);
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );
}
