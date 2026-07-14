// text part 渲染：接现有 renderMessageContent 管线（MarkdownMessage + <file> 块
// 折叠 + 图片预览回调）。part.text 即整条消息的原始 content 字符串。
import { useMessage, type TextMessagePartProps } from '@assistant-ui/react';
import { usePlayground } from '../../PlaygroundContext';
import { renderMessageContent } from '../../MessageRendering';
import { generatedImages, hasCopyableMessageText } from '../../utils';
import { styles } from '../../styles';
import { MessageCopyButton } from './MessageCopyButton';

export function TextPart(props: TextMessagePartProps) {
  const { isMobile, showImagePreview, interactiveMessageOptions } = usePlayground();
  const isUser = useMessage(s => s.role === 'user');
  const text = props.text;
  const images = generatedImages(text);
  // 传原始 content：handleMessageCopy 会同时写入纯文本与含图片的富文本
  const showCopyButton = hasCopyableMessageText(text) || images.length > 0;
  const trailingInlineAction = showCopyButton ? (
    <span
      className={`pg-msg-copy${isMobile ? ' pg-msg-copy-visible' : ''}`}
      style={styles.messageCopyInline}
    >
      <MessageCopyButton content={text} buttonStyle={styles.messageCopyAfterTextBtn} />
    </span>
  ) : undefined;

  return (
    <div className="pg-copy-zone" style={styles.messageContent}>
      {renderMessageContent(text, {
        ...interactiveMessageOptions,
        onImagePreview: images.length > 0
          ? (_url, _alt, imageIndex) => showImagePreview(images, imageIndex)
          : undefined,
        trailingInlineAction,
        // 只有用户消息才有真实附件块；助手输出里的同形文本按普通 markdown 渲染
        parseFileBlocks: isUser,
      })}
    </div>
  );
}
