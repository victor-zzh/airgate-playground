import type { CSSProperties } from 'react';
import type { Message } from './types';
import { generatedImages, hasCopyableMessageText } from './utils';
import { usePlayground } from './PlaygroundContext';
import { renderMessageContent } from './MessageRendering';
import { styles } from './styles';
import { InputArea } from './InputArea';

export function ChatView() {
  const {
    t,
    activeId,
    isMobile,
    messages,
    isStreaming,
    isActiveConversationStreaming,
    streamContent,
    streamReasoning,
    streamConversationId,
    error,
    retryRequest,
    hasRecoverableUserMessage,
    interactionNotice,
    hoveredCopyTarget,
    setHoveredCopyTarget,
    thinkingVisible,
    messagesAreaRef,
    messagesEndRef,
    createConversation,
    regenerateLastResponse,
    regenerateUnfinishedResponse,
    handleMessageCopy,
    showImagePreview,
    interactiveMessageOptions,
  } = usePlayground();

  const renderCopyButton = (content: string, label = 'Copy message', preventToggle = false, buttonStyle: CSSProperties = {}) => (
    <button
      type="button"
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
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );

  const renderCopyableMessageContent = (targetID: string, content: string, message?: Message) => {
    const copyVisible = isMobile || hoveredCopyTarget === targetID;
    const images = generatedImages(content);
    // 传原始 content：handleMessageCopy 会同时写入纯文本与含图片的富文本
    const showCopyButton = hasCopyableMessageText(content) || images.length > 0;
    const trailingInlineAction = showCopyButton ? (
      <span style={{
        ...styles.messageCopyAfterText,
        ...(copyVisible ? styles.messageCopyAfterTextVisible : null),
      }}>
        {renderCopyButton(content, 'Copy message', false, styles.messageCopyAfterTextBtn)}
      </span>
    ) : undefined;

    return (
      <div
        style={styles.messageContent}
        onMouseEnter={() => setHoveredCopyTarget(targetID)}
        onMouseLeave={() => setHoveredCopyTarget(current => (current === targetID ? null : current))}
        onFocus={() => setHoveredCopyTarget(targetID)}
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setHoveredCopyTarget(current => (current === targetID ? null : current));
          }
        }}
      >
        {renderMessageContent(content, {
          ...interactiveMessageOptions,
          onImagePreview: images.length > 0 ? (_url, _alt, imageIndex) => showImagePreview(images, imageIndex) : undefined,
          trailingInlineAction,
          // 只有用户消息才有真实附件块；助手输出里的同形文本按普通 markdown 渲染
          parseFileBlocks: message?.role === 'user',
        })}
        {!message && null}
      </div>
    );
  };

  return (
    <>
      <div ref={messagesAreaRef} style={styles.messagesArea}>
        {!activeId && (
          <div style={{ ...styles.emptyState, ...(isMobile ? styles.emptyStateMobile : null) }}>
            <div style={styles.emptyTitle}>{t('playground.empty_title')}</div>
            <div style={styles.emptyDesc}>{t('playground.empty_description')}</div>
            <button style={styles.emptyBtn} onClick={createConversation}>
              {t('playground.new_conversation')}
            </button>
          </div>
        )}

        {activeId && messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{
                ...styles.messageRow,
                ...(isMobile ? styles.messageRowMobile : null),
                ...(isUser ? styles.messageRowUser : styles.messageRowAssistant),
              }}
            >
              <div style={isUser ? { ...styles.userBubble, ...(isMobile ? styles.userBubbleMobile : null) } : styles.assistantBlock}>
                {!isUser && msg.reasoning && thinkingVisible && (
                  <details style={styles.reasoningBox} open>
                    <summary style={styles.reasoningSummary}>
                      <span>{t('playground.thinking_title', { defaultValue: 'Thinking' })}</span>
                      {renderCopyButton(msg.reasoning, t('playground.copy_thinking', { defaultValue: 'Copy thinking' }), true)}
                    </summary>
                    <div style={styles.reasoningContent}>
                      {renderMessageContent(msg.reasoning, interactiveMessageOptions)}
                    </div>
                  </details>
                )}
                {renderCopyableMessageContent(`message-${msg.id}`, msg.content, msg)}
                {!isUser && msg.model && (
                  <div style={styles.messageMeta}>
                    <span style={styles.metaBadge}>{msg.model}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isActiveConversationStreaming && (
          <div style={{
            ...styles.messageRow,
            ...(isMobile ? styles.messageRowMobile : null),
            ...styles.messageRowAssistant,
          }}>
            <div style={styles.assistantBlock}>
              {streamReasoning && thinkingVisible && (
                <details style={styles.reasoningBox} open>
                  <summary style={styles.reasoningSummary}>
                    <span>{t('playground.thinking_title', { defaultValue: 'Thinking' })}</span>
                    {renderCopyButton(streamReasoning, t('playground.copy_thinking', { defaultValue: 'Copy thinking' }), true)}
                  </summary>
                  <div style={styles.reasoningContent}>
                    {renderMessageContent(streamReasoning, interactiveMessageOptions)}
                  </div>
                </details>
              )}
              {streamContent ? (
                <>
                  {renderCopyableMessageContent(`stream-${streamConversationId || 'active'}`, streamContent)}
                  <div style={styles.messageMeta}>
                    <span style={styles.streamingDot} />
                    <span>{t('playground.streaming')}</span>
                  </div>
                </>
              ) : !streamReasoning || !thinkingVisible ? (
                <div style={{ ...styles.messageContent, opacity: 0.5 }}>
                  <span style={styles.thinkingDots}>{t('playground.thinking')}</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {hasRecoverableUserMessage && (
          <div style={{ ...styles.errorBar, ...styles.recoverableBar, ...(isMobile ? styles.errorBarMobile : null) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            <span style={styles.errorMessage}>{t('playground.response_unfinished', { defaultValue: 'Response was interrupted before the assistant replied.' })}</span>
            <button
              type="button"
              style={styles.recoverableRetryBtn}
              onClick={regenerateUnfinishedResponse}
              title={t('playground.regenerate')}
              aria-label={t('playground.regenerate')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 1-15.6 6" />
                <path d="M3 12a9 9 0 0 1 15.6-6" />
                <path d="M19 2v4h-4" />
                <path d="M5 22v-4h4" />
              </svg>
              {t('playground.regenerate')}
            </button>
          </div>
        )}

        {error && (
          <div style={{ ...styles.errorBar, ...(isMobile ? styles.errorBarMobile : null) }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            <span style={styles.errorMessage}>{error}</span>
            {retryRequest && retryRequest.conversationID === activeId && !isStreaming && (
              <button
                type="button"
                style={styles.errorRetryBtn}
                onClick={regenerateLastResponse}
                title={t('playground.regenerate')}
                aria-label={t('playground.regenerate')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 1-15.6 6" />
                  <path d="M3 12a9 9 0 0 1 15.6-6" />
                  <path d="M19 2v4h-4" />
                  <path d="M5 22v-4h4" />
                </svg>
                {t('playground.regenerate')}
              </button>
            )}
          </div>
        )}

        {interactionNotice && (
          <div style={styles.interactionNotice}>{interactionNotice}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {activeId && <InputArea />}
    </>
  );
}
