import { useEffect, type CSSProperties } from 'react';
import type { Message, MessageContentOptions, PreviewImage } from './types';
import { copyableMessageText, generatedImages, hasCopyableMessageText } from './utils';
import { usePlayground } from './PlaygroundContext';
import { renderMessageContent } from './MessageRendering';
import { styles } from './styles';
import { InputArea } from './InputArea';

export function ChatView() {
  const ctx = usePlayground();
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
    regeneratingImage,
    canvasMode,
    thinkingVisible,
    messagesAreaRef,
    messagesEndRef,
    createConversation,
    regenerateLastResponse,
    regenerateUnfinishedResponse,
    regenerateImage,
    handleMessageCopy,
    showImagePreview,
    editGeneratedImage,
    handleImageDownload,
    interactiveMessageOptions,
    sendMessage,
    submitRef,
  } = ctx;

  // Register sendMessage as the submit handler for chat mode
  useEffect(() => {
    submitRef.current = sendMessage;
  }, [sendMessage, submitRef]);

  // ── Inline render helpers ──────────────────────────────────────────────

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

  const renderImageDownloadButton = (image: PreviewImage, preventToggle = false) => (
    <button
      type="button"
      style={styles.imageDownloadBtn}
      title={t('playground.download_image')}
      aria-label={t('playground.download_image')}
      onClick={(event) => {
        if (preventToggle) {
          event.preventDefault();
          event.stopPropagation();
        }
        handleImageDownload(image.url, image.alt || t('playground.generated_image'));
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
      </svg>
    </button>
  );

  const renderImageEditButton = (image: PreviewImage, model?: string, platform?: string, preventToggle = false) => (
    <button
      type="button"
      style={{ ...styles.regenerateImageBtn, opacity: isStreaming ? 0.5 : 1 }}
      onClick={(event) => {
        if (preventToggle) {
          event.preventDefault();
          event.stopPropagation();
        }
        void editGeneratedImage(image.url, image.alt || t('playground.generated_image'), model, platform);
      }}
      disabled={isStreaming}
      title={t('playground.edit_generated_image', { defaultValue: 'Edit this image' })}
      aria-label={t('playground.edit_generated_image', { defaultValue: 'Edit this image' })}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    </button>
  );

  const renderCopyableMessageContent = (targetID: string, content: string, message?: Message) => {
    const copyVisible = isMobile || hoveredCopyTarget === targetID;
    const copyableText = copyableMessageText(content);
    const showCopyButton = hasCopyableMessageText(content);
    const images = generatedImages(content);
    const imageOptions: Partial<MessageContentOptions> = message && images.length > 0 ? {
      onImagePreview: (_url, _alt, imageIndex) => showImagePreview(images, imageIndex),
      imageActions: (image, imageIndex) => {
        const isRegeneratingThisImage = regeneratingImage?.messageID === message.id && regeneratingImage.imageIndex === imageIndex;
        return (
          <>
            {renderImageDownloadButton(image)}
            {renderImageEditButton(image, message.model, message.platform)}
            <button
              type="button"
              style={{ ...styles.regenerateImageBtn, opacity: isStreaming ? 0.5 : 1 }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                regenerateImage(messages.findIndex(item => item.id === message.id), imageIndex);
              }}
              disabled={isStreaming}
              title={isRegeneratingThisImage ? t('playground.regenerating_image', { defaultValue: 'Regenerating image…' }) : t('playground.retry_image')}
              aria-label={isRegeneratingThisImage ? t('playground.regenerating_image', { defaultValue: 'Regenerating image…' }) : t('playground.retry_image')}
            >
              {isRegeneratingThisImage ? (
                <span style={styles.imageRetrySpinner} />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 1-15.6 6" />
                  <path d="M3 12a9 9 0 0 1 15.6-6" />
                  <path d="M19 2v4h-4" />
                  <path d="M5 22v-4h4" />
                </svg>
              )}
            </button>
          </>
        );
      },
    } : {};
    const trailingInlineAction = showCopyButton ? (
      <span style={{
        ...styles.messageCopyAfterText,
        ...(copyVisible ? styles.messageCopyAfterTextVisible : null),
      }}>
        {renderCopyButton(copyableText, 'Copy message', false, styles.messageCopyAfterTextBtn)}
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
          ...imageOptions,
          trailingInlineAction,
        })}
      </div>
    );
  };

  // ── JSX ────────────────────────────────────────────────────────────────

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

        {activeId && messages.map((msg, messageIndex) => {
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

        {isActiveConversationStreaming && streamContent && (
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
              {renderCopyableMessageContent(`stream-${streamConversationId || 'active'}`, streamContent)}
              <div style={styles.messageMeta}>
                <span style={styles.streamingDot} />
                <span>{t('playground.streaming')}</span>
              </div>
            </div>
          </div>
        )}

        {isActiveConversationStreaming && !streamContent && (
          <div style={{
            ...styles.messageRow,
            ...(isMobile ? styles.messageRowMobile : null),
            ...styles.messageRowAssistant,
          }}>
            <div style={styles.assistantBlock}>
              {streamReasoning && thinkingVisible ? (
                <details style={styles.reasoningBox} open>
                  <summary style={styles.reasoningSummary}>
                    <span>{t('playground.thinking_title', { defaultValue: 'Thinking' })}</span>
                    {renderCopyButton(streamReasoning, t('playground.copy_thinking', { defaultValue: 'Copy thinking' }), true)}
                  </summary>
                  <div style={styles.reasoningContent}>
                    {renderMessageContent(streamReasoning, interactiveMessageOptions)}
                  </div>
                </details>
              ) : (
                <div style={{ ...styles.messageContent, opacity: 0.5 }}>
                  <span style={styles.thinkingDots}>{t('playground.thinking')}</span>
                </div>
              )}
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

        <div ref={!canvasMode ? messagesEndRef : undefined} />
      </div>

      {/* Input (chat view) */}
      {activeId && <InputArea />}
    </>
  );
}
