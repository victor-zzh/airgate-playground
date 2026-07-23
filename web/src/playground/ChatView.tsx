import { Thread } from './aui/Thread';
import { Composer } from './aui/Composer';
import { usePlayground } from './PlaygroundContext';
import { styles } from './styles';

export function ChatView() {
  const {
    t,
    activeId,
    isMobile,
    isStreaming,
    error,
    retryRequest,
    hasRecoverableUserMessage,
    hasOutputLimitReached,
    interactionNotice,
    createConversation,
    regenerateLastResponse,
    regenerateUnfinishedResponse,
    continueLastResponse,
    isDraggingFiles,
  } = usePlayground();

  // 错误条/恢复条/复制提示：保持原来在滚动容器内、消息之后的文档流位置。
  // 恢复条只在「重开/刷新后末位仍是用户提问」的真实场景显示(hasRecoverableUserMessage
  // 已严格门控:非发送中、非流式、无错误),不再有发送瞬间的误闪、也不与错误条并存。
  const notices = (
    <>
      {hasRecoverableUserMessage && (
        <div style={{ ...styles.errorBar, ...(isMobile ? styles.errorBarMobile : null) }} role="status">
          <span style={styles.recoveryIcon} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 1-15.6 6" />
              <path d="M3 12a9 9 0 0 1 15.6-6" />
              <path d="M19 2v4h-4" />
              <path d="M5 22v-4h4" />
            </svg>
          </span>
          <span style={styles.errorMessage}>{t('playground.response_unfinished')}</span>
          <button
            type="button"
            className="pg-error-retry"
            style={styles.errorRetryBtn}
            onClick={regenerateUnfinishedResponse}
            title={t('playground.regenerate')}
            aria-label={t('playground.regenerate')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 0 1-15.6 6" />
              <path d="M3 12a9 9 0 0 1 15.6-6" />
              <path d="M19 2v4h-4" />
              <path d="M5 22v-4h4" />
            </svg>
            {t('playground.regenerate')}
          </button>
        </div>
      )}

      {hasOutputLimitReached && (
        <div style={{ ...styles.errorBar, ...(isMobile ? styles.errorBarMobile : null) }} role="status">
          <span style={styles.errorMessage}>{t('playground.output_limit_reached')}</span>
          <button
            type="button"
            className="pg-error-retry"
            style={styles.errorRetryBtn}
            onClick={continueLastResponse}
          >
            {t('playground.continue_generation')}
          </button>
        </div>
      )}

      {error && (
        <div style={{ ...styles.errorBar, ...(isMobile ? styles.errorBarMobile : null) }} role="alert">
          <span style={styles.errorIcon} aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
          </span>
          <span style={styles.errorMessage}>{error}</span>
          {retryRequest && retryRequest.conversationID === activeId && !isStreaming && (
            <button
              type="button"
              className="pg-error-retry"
              style={styles.errorRetryBtn}
              onClick={regenerateLastResponse}
              title={t('playground.regenerate')}
              aria-label={t('playground.regenerate')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    </>
  );

  return (
    <>
      {activeId ? (
        <Thread>{notices}</Thread>
      ) : (
        <div style={styles.messagesArea}>
          <div style={{ ...styles.emptyState, ...(isMobile ? styles.emptyStateMobile : null) }}>
            <div style={styles.emptyTitle}>{t('playground.empty_title')}</div>
            <div style={styles.emptyDesc}>{t('playground.empty_description')}</div>
            <button style={styles.emptyBtn} onClick={createConversation}>
              {t('playground.new_conversation')}
            </button>
          </div>
          {notices}
        </div>
      )}

      {activeId && <Composer />}

      {isDraggingFiles && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.45)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              padding: '18px 30px',
              borderRadius: 12,
              border: '2px dashed rgba(255, 255, 255, 0.75)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              background: 'rgba(0, 0, 0, 0.35)',
            }}
          >
            {t('playground.drop_to_attach')}
          </div>
        </div>
      )}
    </>
  );
}
