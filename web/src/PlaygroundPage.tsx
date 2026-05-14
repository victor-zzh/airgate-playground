import { useTranslation } from 'react-i18next';
import { cssVar } from '@doudou-start/airgate-theme';
import { PlaygroundProvider, usePlayground } from './playground/PlaygroundContext';
import { ChatView } from './playground/ChatView';
import { styles, keyframes } from './playground/styles';

// ── Chat page (/chat) ──────────────────────────────────────────────

export function ChatPage() {
  return (
    <PlaygroundProvider initialCanvasMode={false}>
      <ChatShell />
    </PlaygroundProvider>
  );
}

export default ChatPage;

function ChatShell() {
  const { t } = useTranslation();
  const {
    isMobile, sidebarOpen, setSidebarOpen, activeId,
    previewImage, setPreviewImage, showNextPreviewImage,
    selectedModelIsImage, isEditPanelOpen, editSource, editStageSize,
    visibleEditSelection, isEditSelectionConfirmable, isActiveConversationStreaming,
    editCanvasRef, editCanvasContainerRef,
    cancelEditPanel, triggerEditImagePicker, clearEditSelection, confirmEditSelection,
    handleSelectionPointerDown, handleSelectionPointerMove, finishSelectionDrag,
    editSelection, error, userInfo,
    sidebarConversations, createConversation, openConversation, deleteConversation,
  } = usePlayground();

  return (
    <div data-full-bleed data-pg-aesthetic style={styles.layout}>
      {sidebarOpen && isMobile && (
        <div style={styles.sidebarBackdrop} onClick={() => setSidebarOpen(false)} />
      )}

      <ImagePreviewOverlay />
      <ImageEditPanel />

      {/* Sidebar */}
      {sidebarOpen ? (
        <div style={{ ...styles.sidebar, ...(isMobile ? styles.sidebarMobile : null) }}>
          <div style={styles.sidebarHeader}>
            <div style={styles.sidebarTitleGroup}>
              <button style={styles.toggleBtn} onClick={() => setSidebarOpen(false)} aria-label="Collapse conversations">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M6 2v12" /><path d="M2 2h12v12H2z" /><path d="M10 6l-2 2 2 2" />
                </svg>
              </button>
              <span style={styles.sidebarTitle}>{t('playground.conversations')}</span>
            </div>
            <button
              style={styles.newBtn}
              onClick={createConversation}
              title={t('playground.new_conversation')}
              aria-label={t('playground.new_conversation')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M7 1v12M1 7h12" />
              </svg>
            </button>
          </div>

          <div style={styles.convList}>
            {sidebarConversations.map(c => {
              const isActive = c.id === activeId;
              return (
                <div
                  key={c.id}
                  className={`pg-conv-item${isActive ? ' is-active' : ''}`}
                  style={{ ...styles.convItem, background: isActive ? cssVar('bgHover') : 'transparent' }}
                  onClick={() => openConversation(c.id)}
                >
                  <span style={{ ...styles.convTitle, color: isActive ? cssVar('text') : cssVar('textSecondary'), fontWeight: isActive ? 500 : 400 }}>
                    {c.title || t('playground.new_conversation')}
                  </span>
                  <button
                    type="button"
                    className="pg-conv-delete"
                    style={styles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                    title={t('playground.delete_conversation')}
                    aria-label={t('playground.delete_conversation')}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              );
            })}
            {sidebarConversations.length === 0 && (
              <div style={styles.emptyConvList}><span>{t('playground.no_conversations')}</span></div>
            )}
          </div>

          {userInfo && (
            <div style={styles.balanceBar}>
              <span style={styles.balanceLabel}>{t('playground.balance')}</span>
              <span style={styles.balanceValue}>${userInfo.balance.toFixed(4)}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ ...styles.sidebarRail, ...(isMobile ? styles.sidebarRailMobile : null) }}>
          <button style={styles.toggleBtn} onClick={() => setSidebarOpen(true)} aria-label="Expand conversations">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 2v12" /><path d="M2 2h12v12H2z" /><path d="M8 6l2 2-2 2" />
            </svg>
          </button>
        </div>
      )}

      {/* Main */}
      <div style={styles.main}>
        <ChatView />
      </div>

      <style>{keyframes}</style>
    </div>
  );
}

// ── Shared small components ────────────────────────────────────────

function ImagePreviewOverlay() {
  const { t } = useTranslation();
  const { previewImage, setPreviewImage, showNextPreviewImage } = usePlayground();

  if (!previewImage) return null;
  const current = previewImage.images[previewImage.index] || previewImage.images[0];
  if (!current) return null;
  const hasNav = previewImage.images.length > 1;

  return (
    <div style={styles.imagePreviewOverlay} role="dialog" aria-modal="true" aria-label={current.alt || t('playground.image_preview')} onClick={() => setPreviewImage(null)}>
      <div style={styles.imagePreviewModal} onClick={e => e.stopPropagation()}>
        <img src={current.url} alt={current.alt} style={styles.imagePreviewLarge} />
        {hasNav && (
          <>
            <button type="button" style={{ ...styles.imagePreviewNavBtn, left: 12 }} onClick={() => showNextPreviewImage(-1)} aria-label={t('playground.previous_image', { defaultValue: 'Previous image' })}>‹</button>
            <button type="button" style={{ ...styles.imagePreviewNavBtn, right: 12 }} onClick={() => showNextPreviewImage(1)} aria-label={t('playground.next_image', { defaultValue: 'Next image' })}>›</button>
            <div style={styles.imagePreviewCounter}>{previewImage.index + 1} / {previewImage.images.length}</div>
          </>
        )}
        <button type="button" style={styles.imagePreviewCloseBtn} onClick={() => setPreviewImage(null)} aria-label={t('playground.close_image_preview')}>×</button>
      </div>
    </div>
  );
}

function ImageEditPanel() {
  const { t } = useTranslation();
  const {
    selectedModelIsImage, isEditPanelOpen, editSource, editStageSize, isMobile,
    visibleEditSelection, isEditSelectionConfirmable, isActiveConversationStreaming,
    editCanvasRef, editCanvasContainerRef, editSelection, error,
    cancelEditPanel, triggerEditImagePicker, clearEditSelection, confirmEditSelection,
    handleSelectionPointerDown, handleSelectionPointerMove, finishSelectionDrag,
  } = usePlayground();

  if (!selectedModelIsImage || !isEditPanelOpen) return null;

  return (
    <div style={styles.editModalOverlay} role="dialog" aria-modal="true" aria-label={t('playground.edit_image_region')} onClick={cancelEditPanel}>
      <div style={{ ...styles.editModalCard, ...(isMobile ? styles.editModalCardMobile : null) }} onClick={e => e.stopPropagation()}>
        <div style={styles.editModalHeader}>
          <div style={styles.imageEditTitleWrap}>
            <span style={styles.imageEditTitle}>{t('playground.edit_image_region')}</span>
            <span style={styles.imageEditSubtitle}>
              {editSource ? t('playground.edit_image_modal_hint', { defaultValue: 'Drag a region on the image, then describe the change for that area.' }) : t('playground.choose_source_image_region_hint')}
            </span>
          </div>
          <div style={styles.imageEditHeaderActions}>
            <button type="button" style={styles.imageEditGhostBtn} onClick={triggerEditImagePicker} disabled={isActiveConversationStreaming}>
              {editSource ? t('playground.replace_source') : t('playground.choose_source')}
            </button>
            <button type="button" style={styles.imageEditIconBtn} onClick={cancelEditPanel} aria-label={t('playground.close_image_preview', { defaultValue: 'Close' })}>×</button>
          </div>
        </div>

        {editSource ? (
          <div style={{ ...styles.editModalBody, ...(isMobile ? styles.editModalBodyMobile : null) }}>
            <div ref={editCanvasContainerRef} style={styles.editModalStageWrap}>
              <div style={{ ...styles.imageEditStage, ...(editStageSize ? { width: editStageSize.width, height: editStageSize.height } : null) }}>
                <img src={editSource.url} alt={editSource.name} style={styles.imageEditSource} draggable={false} />
                {visibleEditSelection && (
                  <div style={{ ...styles.imageEditSelection, left: visibleEditSelection.x, top: visibleEditSelection.y, width: visibleEditSelection.width, height: visibleEditSelection.height }} />
                )}
                <canvas ref={editCanvasRef} style={styles.imageEditCanvas} onPointerDown={handleSelectionPointerDown} onPointerMove={handleSelectionPointerMove} onPointerUp={finishSelectionDrag} onPointerCancel={finishSelectionDrag} aria-label="Box-select image edit region" />
              </div>
            </div>
            <div style={styles.editModalSide}>
              <div style={styles.imageEditBadge}>{editSelection ? t('playground.region_selected') : t('playground.drag_to_select')}</div>
              <div style={styles.imageEditFilename}>{editSource.name}</div>
              <button type="button" style={{ ...styles.imageEditGhostBtn, opacity: editSelection ? 1 : 0.5 }} onClick={clearEditSelection} disabled={!editSelection || isActiveConversationStreaming}>
                {t('playground.clear_selection')}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" style={styles.imageEditEmptyBtn} onClick={triggerEditImagePicker} disabled={isActiveConversationStreaming}>
            {t('playground.choose_source_image_for_regional_editing')}
          </button>
        )}

        <div style={styles.editModalFooter}>
          {isActiveConversationStreaming && (
            <div style={styles.editModalStatus}>
              <span style={styles.streamingDot} />
              <span>{t('playground.edit_modal_generating_bg', { defaultValue: 'Generating edit — this can take 10–30 seconds. You can close this dialog; the result will appear in chat when ready.' })}</span>
            </div>
          )}
          {error && !isActiveConversationStreaming && (
            <div style={styles.editModalError}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
              <span>{error}</span>
            </div>
          )}
          <div style={styles.editModalActions}>
            <span style={styles.editModalHint}>
              {editSelection ? t('playground.edit_modal_region_hint', { defaultValue: 'Selection confirmed here; describe the edit in the main chat input.' }) : t('playground.edit_modal_full_hint', { defaultValue: 'Select a region, then confirm it before returning to chat.' })}
            </span>
            <div style={styles.editModalBtnGroup}>
              <button type="button" style={styles.imageEditGhostBtn} onClick={cancelEditPanel}>
                {isActiveConversationStreaming ? t('playground.edit_modal_run_in_background', { defaultValue: 'Run in background' }) : t('playground.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button type="button" style={{ ...styles.editModalSubmitBtn, opacity: isEditSelectionConfirmable ? 1 : 0.4 }} onClick={() => void confirmEditSelection()} disabled={!isEditSelectionConfirmable || isActiveConversationStreaming}>
                {t('playground.confirm_selection', { defaultValue: 'Confirm selection' })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
