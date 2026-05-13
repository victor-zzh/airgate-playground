import type { ReasoningEffort } from './types';
import { IMAGE_SIZE_AUTO, IMAGE_SIZE_OPTIONS } from './constants';
import { usePlayground } from './PlaygroundContext';
import { styles } from './styles';

export function InputArea({ compact }: { compact?: boolean }) {
  const ctx = usePlayground();
  const {
    t,
    activeId,
    isMobile,
    isActiveConversationStreaming,
    canSendMessage,
    input,
    setInput,
    autoResize,
    handlePaste,
    handleKeyDown,
    pendingImages,
    editSource,
    openPendingImageForEdit,
    removePendingImage,
    inputRef,
    fileInputRef,
    editFileInputRef,
    handleImageChange,
    handleEditImageChange,
    renderCustomSelect,
    selectedModel,
    modelOptions,
    imageModelOptions,
    setSelectedModel,
    selectedModelIsImage,
    selectedModelSupportsReasoning,
    imageSizeSettings,
    updateImageSizeSettings,
    reasoningEffort,
    setReasoningEffort,
    thinkingVisible,
    setThinkingVisible,
    triggerImagePicker,
    isEditPanelOpen,
    stopStreaming,
    confirmedImageEdit,
    submitImageEdit,
    sendMessage,
    sendCanvasMessage,
    selectedPlatform,
    selectedModelID,
    createCanvasConversation,
    isStreaming,
  } = ctx;

  if (!activeId && !compact) return null;

  return (
    <div
      style={{
        ...styles.inputArea,
        ...(isMobile ? styles.inputAreaMobile : null),
        ...(compact ? styles.canvasWorkflowInput : null),
      }}
      onPointerDown={compact ? event => event.stopPropagation() : undefined}
      onWheel={compact ? event => event.stopPropagation() : undefined}
    >
      <div style={{
        ...styles.inputWrapper,
        ...(isMobile ? styles.inputWrapperMobile : null),
        ...(isActiveConversationStreaming ? styles.inputWrapperStreaming : null),
        ...(compact ? { maxWidth: '100%', borderRadius: 16 } : null),
      }}>
        {pendingImages.length > 0 && (
          <div style={styles.imagePreviewList}>
            {pendingImages.map(image => (
              <div
                key={image.id}
                role="button"
                tabIndex={isActiveConversationStreaming ? -1 : 0}
                style={{
                  ...styles.imagePreviewItem,
                  ...(editSource?.id === image.id ? styles.imagePreviewItemActive : null),
                  ...(isActiveConversationStreaming ? { cursor: 'default', opacity: 0.6 } : null),
                }}
                onClick={() => void openPendingImageForEdit(image)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  void openPendingImageForEdit(image);
                }}
                title={t('playground.edit_generated_image', { defaultValue: 'Edit this image' })}
                aria-label={t('playground.edit_generated_image', { defaultValue: 'Edit this image' })}
                aria-disabled={isActiveConversationStreaming}
              >
                <img src={image.url} alt={image.name} style={styles.imagePreview} />
                <span style={styles.imagePreviewEditBadge}>{t('playground.edit')}</span>
                <button
                  type="button"
                  style={styles.removeImageBtn}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    removePendingImage(image.id);
                  }}
                  aria-label={`Remove ${image.name}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={inputRef}
          style={styles.textarea}
          value={input}
          onChange={e => {
            setInput(e.target.value);
            autoResize(e.target);
          }}
          onFocus={() => { if (compact && !activeId) createCanvasConversation(); }}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder={compact
            ? t('playground.canvas_input_placeholder', { defaultValue: '描述你想创作的内容...（按 Enter 发送，Shift+Enter 换行）' })
            : t('playground.input_placeholder')}
          rows={1}
          disabled={isActiveConversationStreaming}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={styles.fileInput}
          onChange={handleImageChange}
          disabled={isActiveConversationStreaming}
        />
        <input
          ref={editFileInputRef}
          type="file"
          accept="image/*"
          style={styles.fileInput}
          onChange={handleEditImageChange}
          disabled={isActiveConversationStreaming}
        />
        {compact ? (
          <>
            <div style={styles.canvasInputRow}>
              {renderCustomSelect({
                id: 'model',
                value: selectedModel,
                options: imageModelOptions,
                onChange: setSelectedModel,
                ariaLabel: t('playground.model'),
                variant: 'model',
                alignRight: true,
              })}
            </div>
            <div style={styles.canvasInputRow}>
              {selectedModelIsImage && renderCustomSelect({
                id: 'image-size',
                value: imageSizeSettings.value,
                options: IMAGE_SIZE_OPTIONS,
                onChange: value => updateImageSizeSettings({ value }),
                ariaLabel: 'Image size',
                alignRight: true,
              })}
              <div style={{ flex: 1 }} />
              <button
                type="button"
                style={styles.canvasInputIconBtn}
                onMouseDown={e => e.preventDefault()}
                onClick={triggerImagePicker}
                disabled={isActiveConversationStreaming || isEditPanelOpen}
                title={t('playground.attach_images')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </button>
              {isActiveConversationStreaming ? (
                <button
                  style={styles.canvasInputIconBtn}
                  onMouseDown={e => e.preventDefault()}
                  onClick={stopStreaming}
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
                    <rect x="2" y="2" width="8" height="8" rx="1" />
                  </svg>
                </button>
              ) : (
                <button
                  style={{ ...styles.canvasInputSendBtn, opacity: canSendMessage ? 1 : 0.4 }}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    if (confirmedImageEdit) { void submitImageEdit(); return; }
                    void sendCanvasMessage();
                  }}
                  disabled={!canSendMessage}
                  title={selectedPlatform && selectedModelID ? undefined : t('playground.select_model_first')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              )}
            </div>
          </>
        ) : (
        <div style={{ ...styles.inputActions, ...(isMobile ? styles.inputActionsMobile : null) }}>
          <div style={{ ...styles.selectors, ...(isMobile ? styles.selectorsMobile : null) }}>
            {renderCustomSelect({
              id: 'model',
              value: selectedModel,
              options: modelOptions,
              onChange: setSelectedModel,
              ariaLabel: t('playground.model'),
              variant: 'model',
            })}

            {selectedModelIsImage && (
              <div style={{ ...styles.imageSizeInlineControls, ...(isMobile ? styles.imageSizeInlineControlsMobile : null) }}>
                {renderCustomSelect({
                  id: 'image-size',
                  value: imageSizeSettings.value,
                  options: IMAGE_SIZE_OPTIONS,
                  onChange: value => updateImageSizeSettings({ value }),
                  ariaLabel: 'Image size',
                })}
                {!isMobile && imageSizeSettings.value === IMAGE_SIZE_AUTO && (
                  <span style={styles.imageSizeInlinePreview}>upstream default</span>
                )}
              </div>
            )}

            {selectedModelSupportsReasoning && renderCustomSelect({
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
              onMouseDown={e => e.preventDefault()}
              onClick={() => setThinkingVisible(value => !value)}
              title={thinkingVisible
                ? t('playground.hide_thinking', { defaultValue: 'Hide Thinking' })
                : t('playground.show_thinking', { defaultValue: 'Show Thinking' })}
              aria-label={thinkingVisible
                ? t('playground.hide_thinking', { defaultValue: 'Hide Thinking' })
                : t('playground.show_thinking', { defaultValue: 'Show Thinking' })}
              aria-pressed={thinkingVisible}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
                {!thinkingVisible && <path d="M4 4l16 16" />}
              </svg>
              {t('playground.thinking_title', { defaultValue: 'Thinking' })}
            </button>
            <button
              type="button"
              style={{ ...styles.attachBtn, ...(isMobile ? styles.actionBtnMobile : null) }}
              onMouseDown={e => e.preventDefault()}
              onClick={triggerImagePicker}
              disabled={isActiveConversationStreaming || isEditPanelOpen}
              title={t('playground.attach_images')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              {t('playground.image')}
            </button>
            {isActiveConversationStreaming ? (
              <button
                style={{ ...styles.stopBtn, ...(isMobile ? styles.actionBtnMobile : null) }}
                onMouseDown={e => e.preventDefault()}
                onClick={stopStreaming}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="2" y="2" width="8" height="8" rx="1" />
                </svg>
                {t('playground.stop')}
              </button>
            ) : (
              <button
                style={{
                  ...styles.sendBtn,
                  ...(isMobile ? styles.actionBtnMobile : null),
                  opacity: canSendMessage ? 1 : 0.4,
                }}
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  if (confirmedImageEdit) {
                    void submitImageEdit();
                    return;
                  }
                  sendMessage();
                }}
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
        )}
      </div>
    </div>
  );
}
