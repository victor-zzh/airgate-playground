import type { ReasoningEffort } from './types';
import { usePlayground } from './PlaygroundContext';
import { attachmentAcceptList } from './attachments/detect';
import { formatByteSize } from './utils';
import { styles } from './styles';

const ATTACHMENT_ACCEPT = attachmentAcceptList();

export function InputArea() {
  const {
    t,
    isMobile,
    isActiveConversationStreaming,
    canSendMessage,
    input,
    setInput,
    handlePaste,
    handleKeyDown,
    pendingImages,
    pendingFiles,
    isProcessingAttachments,
    removePendingImage,
    removePendingFile,
    inputRef,
    fileInputRef,
    handleAttachmentChange,
    renderNativeSelect,
    selectedModel,
    modelOptions,
    setSelectedModel,
    selectedModelSupportsReasoning,
    reasoningEffort,
    setReasoningEffort,
    thinkingVisible,
    setThinkingVisible,
    triggerImagePicker,
    stopStreaming,
    sendMessage,
    selectedPlatform,
    selectedModelID,
  } = usePlayground();

  return (
    <div style={{ ...styles.inputArea, ...(isMobile ? styles.inputAreaMobile : null) }}>
      <div style={{
        ...styles.inputWrapper,
        ...(isMobile ? styles.inputWrapperMobile : null),
        ...(isActiveConversationStreaming ? styles.inputWrapperStreaming : null),
      }} className="pg-input-wrapper">
        {(pendingImages.length > 0 || pendingFiles.length > 0 || isProcessingAttachments) && (
          <div style={styles.imagePreviewList}>
            {pendingImages.map(image => {
              const sizeLabel = image.compressed && image.originalBytes && image.finalBytes
                ? t('playground.attachment_optimized', {
                  defaultValue: '已优化 {{from}} → {{to}}',
                  from: formatByteSize(image.originalBytes),
                  to: formatByteSize(image.finalBytes),
                })
                : formatByteSize(image.finalBytes || 0);
              const tooltip = [image.name, sizeLabel, image.warningText].filter(Boolean).join('\n');
              return (
                <div
                  key={image.id}
                  style={{
                    ...styles.imagePreviewItem,
                    ...(isActiveConversationStreaming ? { cursor: 'default', opacity: 0.6 } : null),
                  }}
                  title={tooltip}
                >
                  <img src={image.url} alt={image.name} style={styles.imagePreview} />
                  {image.compressed && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 3,
                        bottom: 3,
                        fontSize: 10,
                        lineHeight: '14px',
                        padding: '0 4px',
                        borderRadius: 4,
                        background: 'rgba(0, 0, 0, 0.55)',
                        color: '#fff',
                        pointerEvents: 'none',
                      }}
                    >
                      {t('playground.attachment_optimized_badge', { defaultValue: '已优化' })}
                    </span>
                  )}
                  <button
                    type="button"
                    style={styles.removeImageBtn}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      removePendingImage(image.id);
                    }}
                    aria-label={`Remove ${image.name}`}
                    disabled={isActiveConversationStreaming}
                  >
                    &times;
                  </button>
                </div>
              );
            })}
            {pendingFiles.map(file => {
              const metaParts = [formatByteSize(file.size)];
              if (file.truncated) metaParts.push(t('playground.attachment_truncated_badge', { defaultValue: '已截断' }));
              const tooltip = [file.name, metaParts.filter(Boolean).join(' · '), file.warningText].filter(Boolean).join('\n');
              return (
                <div
                  key={file.id}
                  style={{
                    ...styles.filePreviewItem,
                    ...(isMobile ? styles.filePreviewItemMobile : null),
                    ...(isActiveConversationStreaming ? { cursor: 'default', opacity: 0.6 } : null),
                  }}
                  title={tooltip}
                >
                  <div style={styles.filePreviewIcon} aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M8 13h8" />
                      <path d="M8 17h6" />
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.filePreviewName} title={file.name}>{file.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.65, whiteSpace: 'nowrap' }}>
                      {metaParts.filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={styles.removeImageBtn}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      removePendingFile(file.id);
                    }}
                    aria-label={`Remove ${file.name}`}
                    disabled={isActiveConversationStreaming}
                  >
                    &times;
                  </button>
                </div>
              );
            })}
            {isProcessingAttachments && (
              <div style={{ ...styles.filePreviewItem, opacity: 0.75 }}>
                <div style={styles.filePreviewIcon} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.2-8.56">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
                    </path>
                  </svg>
                </div>
                <div style={styles.filePreviewName}>
                  {t('playground.attachment_processing', { defaultValue: '解析附件中…' })}
                </div>
              </div>
            )}
          </div>
        )}

        <textarea
          ref={inputRef}
          style={styles.textarea}
          value={input}
          onChange={event => setInput(event.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder={t('playground.input_placeholder')}
          rows={4}
          disabled={isActiveConversationStreaming}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          multiple
          style={styles.fileInput}
          onChange={handleAttachmentChange}
          disabled={isActiveConversationStreaming}
        />

        <div style={{ ...styles.inputActions, ...(isMobile ? styles.inputActionsMobile : null) }}>
          <div style={{ ...styles.selectors, ...(isMobile ? styles.selectorsMobile : null) }}>
            {renderNativeSelect({
              id: 'model',
              value: selectedModel,
              options: modelOptions,
              onChange: setSelectedModel,
              ariaLabel: t('playground.model'),
            })}

            {selectedModelSupportsReasoning && renderNativeSelect({
              id: 'reasoning-effort',
              value: reasoningEffort,
              options: [
                { value: 'minimal', label: 'Minimal' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'xhigh', label: 'XHigh' },
              ],
              onChange: value => setReasoningEffort(value as ReasoningEffort),
              ariaLabel: 'Reasoning effort',
            })}
          </div>

          <div style={{ ...styles.inputButtonGroup, ...(isMobile ? styles.inputButtonGroupMobile : null) }}>
            <button
              type="button"
              style={{
                ...styles.thinkingToggleBtn,
                ...(thinkingVisible ? styles.thinkingToggleBtnActive : null),
                ...(isMobile ? styles.actionBtnMobile : null),
              }}
              onMouseDown={event => event.preventDefault()}
              onClick={() => setThinkingVisible(value => !value)}
              title={thinkingVisible
                ? t('playground.hide_thinking', { defaultValue: 'Hide Thinking' })
                : t('playground.show_thinking', { defaultValue: 'Show Thinking' })}
              aria-label={thinkingVisible
                ? t('playground.hide_thinking', { defaultValue: 'Hide Thinking' })
                : t('playground.show_thinking', { defaultValue: 'Show Thinking' })}
              aria-pressed={thinkingVisible}
            >
              {thinkingVisible ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M8.5 14.5c-1.4-1.2-2.2-2.9-2.2-4.8a5.7 5.7 0 0 1 11.4 0c0 1.9-.8 3.6-2.2 4.8-.7.6-1.1 1.4-1.1 2.2H9.6c0-.8-.4-1.6-1.1-2.2Z" />
                  <path d="M12 1.8v1.8M4.6 4.6l1.3 1.3M19.4 4.6l-1.3 1.3M2 10h1.8M20.2 10H22" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M8.5 14.5c-1.4-1.2-2.2-2.9-2.2-4.8a5.7 5.7 0 0 1 9-4.6" />
                  <path d="M16.9 8.4c.5 2.2-.2 4.5-2.1 6.1-.7.6-1.1 1.4-1.1 2.2H9.6" />
                  <path d="M4 4l16 16" />
                </svg>
              )}
              {t('playground.thinking_title', { defaultValue: 'Thinking' })}
            </button>

            <button
              type="button"
              style={{ ...styles.attachBtn, ...(isMobile ? styles.actionBtnMobile : null) }}
              onMouseDown={event => event.preventDefault()}
              onClick={triggerImagePicker}
              disabled={isActiveConversationStreaming}
              title={t('playground.attach_files', { defaultValue: 'Attach files' })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              {t('playground.file', { defaultValue: 'File' })}
            </button>

            {isActiveConversationStreaming ? (
              <button
                type="button"
                style={{ ...styles.stopBtn, ...(isMobile ? styles.actionBtnMobile : null) }}
                onMouseDown={event => event.preventDefault()}
                onClick={stopStreaming}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="2" y="2" width="8" height="8" rx="1" />
                </svg>
                {t('playground.stop')}
              </button>
            ) : (
              <button
                type="button"
                style={{
                  ...styles.sendBtn,
                  ...(isMobile ? styles.actionBtnMobile : null),
                  opacity: canSendMessage ? 1 : 0.4,
                }}
                onMouseDown={event => event.preventDefault()}
                onClick={sendMessage}
                disabled={!canSendMessage}
                title={selectedPlatform && selectedModelID ? undefined : t('playground.select_model_first')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                {t('playground.send')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
