import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayground } from './PlaygroundContext';
import { styles } from './styles';
import { copyText } from './utils';
import { CANVAS_CONVERSATION_TITLE_PREFIX, IMAGE_SIZE_OPTIONS } from './constants';
import type { PreviewImage } from './types';

export function CanvasView() {
  const ctx = usePlayground();

  // Register sendCanvasMessage as the submit handler when this view is active
  useEffect(() => {
    if (ctx.canvasMode) {
      ctx.submitRef.current = ctx.sendCanvasMessage;
    }
  }, [ctx.canvasMode, ctx.sendCanvasMessage, ctx.submitRef]);

  // Destructure for convenience
  const {
    t,
    isMobile,
    activeId,
    canvasMode,
    canvasWorkflowNodes,
    allConversationImages,
    canvasConversations,
    expandedPromptNodeId,
    setExpandedPromptNodeId,
    canvasZoom,
    setCanvasZoom,
    canvasPan,
    setCanvasPan,
    canvasContainerRef,
    canvasPanningRef,
    messagesEndRef,
    isStreaming,
    canvasTaskStatus,
    isActiveConversationStreaming,
    createCanvasConversation,
    openCanvasConversation,
    deleteConversation,
    sendCanvasMessage,
    regenerateCanvasNode,
    showImagePreview,
    handleImageDownload,
    interactionNotice,
    setInteractionNotice,
    handleCanvasWheel,
    handleCanvasPanStart,
    handleCanvasPanMove,
    handleCanvasPanEnd,
    resetCanvasView,
    editGeneratedImage,
    // Input area dependencies
    input,
    setInput,
    pendingImages,
    editSource,
    openPendingImageForEdit,
    removePendingImage,
    inputRef,
    fileInputRef,
    editFileInputRef,
    handleImageChange,
    handleEditImageChange,
    handlePaste,
    handleKeyDown,
    autoResize,
    selectedModel,
    setSelectedModel,
    imageModelOptions,
    selectedModelIsImage,
    selectedPlatform,
    selectedModelID,
    imageSizeSettings,
    updateImageSizeSettings,
    renderCustomSelect,
    triggerImagePicker,
    isEditPanelOpen,
    stopStreaming,
    canSendMessage,
    confirmedImageEdit,
    submitImageEdit,
  } = ctx;

  // ── Image drag-to-reposition ────────────────────────────────────────

  const CARD_W = 320;
  const CARD_H = 370;
  const GAP = 24;

  const [imagePositions, setImagePositions] = useState<Record<string, { x: number; y: number }>>({});
  const draggingRef = useRef<{ key: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const imageKey = (img: { messageId: number; imageIndex: number }) => `${img.messageId}-${img.imageIndex}`;

  const gridPosition = useCallback((idx: number, total: number) => {
    const cols = Math.max(1, Math.floor(Math.sqrt(total * 1.5)));
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    return { x: col * (CARD_W + GAP), y: row * (CARD_H + GAP) };
  }, []);

  const getImagePos = useCallback((img: { messageId: number; imageIndex: number }, idx: number, total: number) => {
    const key = imageKey(img);
    return imagePositions[key] || gridPosition(idx, total);
  }, [imagePositions, gridPosition]);

  const handleCardPointerDown = useCallback((e: React.PointerEvent, img: { messageId: number; imageIndex: number }, idx: number, total: number) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    e.stopPropagation();
    const pos = getImagePos(img, idx, total);
    const key = imageKey(img);
    draggingRef.current = { key, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    setDraggingKey(key);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [getImagePos]);

  const handleCardPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const { key, startX, startY, origX, origY } = draggingRef.current;
    const dx = (e.clientX - startX) / canvasZoom;
    const dy = (e.clientY - startY) / canvasZoom;
    setImagePositions(prev => ({ ...prev, [key]: { x: origX + dx, y: origY + dy } }));
  }, [canvasZoom]);

  const handleCardPointerUp = useCallback(() => {
    draggingRef.current = null;
    setDraggingKey(null);
  }, []);

  // ── Local render helpers (not in context) ────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────

  if (!canvasMode) return null;

  return (
    <div style={{ ...styles.canvasLayout, ...(isMobile ? styles.canvasLayoutMobile : null) }}>
      {/* Portfolio sidebar */}
      {!isMobile && (
      <div style={styles.canvasPortfolio}>
        <div style={styles.canvasPortfolioHeader}>
          <div style={styles.canvasPortfolioTitleWrap} />
          <button
            type="button"
            style={styles.canvasPortfolioNewBtn}
            onClick={createCanvasConversation}
            title={t('playground.canvas_new_creation', { defaultValue: '新建创作' })}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M7 1v12M1 7h12" />
            </svg>
          </button>
        </div>

        {canvasConversations.length > 1 && (
          <div style={styles.canvasPortfolioProjects}>
            {canvasConversations.map(c => {
              const isActive = c.id === activeId;
              const displayTitle = c.title.replace(CANVAS_CONVERSATION_TITLE_PREFIX, '') || t('playground.canvas_untitled', { defaultValue: '未命名创作' });
              return (
                <div
                  key={c.id}
                  className={`pg-conv-item${isActive ? ' is-active' : ''}`}
                  style={{
                    ...styles.canvasPortfolioProject,
                    ...(isActive ? styles.canvasPortfolioProjectActive : null),
                  }}
                  onClick={() => openCanvasConversation(c.id)}
                >
                  <span style={styles.canvasPortfolioProjectTitle}>{displayTitle}</span>
                  <button
                    type="button"
                    className="pg-conv-delete"
                    style={styles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                    title={t('playground.delete_conversation')}
                    aria-label={t('playground.delete_conversation')}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={styles.canvasPortfolioStats}>
          <span style={styles.canvasWorkflowHeaderCount}>{canvasWorkflowNodes.length} 节点</span>
          <span style={styles.canvasWorkflowHeaderCount}>{allConversationImages.length} 图</span>
        </div>

        <div style={styles.canvasPortfolioList}>
          {(!activeId || canvasWorkflowNodes.length === 0) && (
            <div style={styles.canvasWorkflowEmptyHint}>
              <div style={styles.canvasWorkflowEmptyOrb}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 18V7a2 2 0 0 1 2-2h7l7 7v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                  <path d="M13 5v6h6" />
                  <path d="M8 14h5M8 17h8" />
                </svg>
              </div>
              <span>{t('playground.canvas_start_hint', { defaultValue: '描述你想创作的内容开始创作' })}</span>
              <small>{t('playground.canvas_start_subhint', { defaultValue: '每次提交都会变成一个可追踪的创作节点。' })}</small>
            </div>
          )}

          {canvasWorkflowNodes.map((node, idx) => {
            const statusLabel = node.status === 'completed'
              ? t('playground.canvas_node_completed', { defaultValue: '已完成' })
              : node.status === 'failed'
                ? t('playground.canvas_node_failed', { defaultValue: '失败' })
                : node.status === 'processing'
                  ? t('playground.canvas_node_processing', { defaultValue: '生成中' })
                  : t('playground.canvas_node_queued', { defaultValue: '排队中' });
            const globalImageIndexes = node.images.map(image => allConversationImages.findIndex(
              ci => ci.messageId === image.messageId && ci.imageIndex === image.imageIndex
            ));
            return (
              <section key={node.id} style={{ ...styles.canvasWorkflowNode, ...(node.status !== 'completed' ? styles.canvasWorkflowNodeActive : null) }}>
                <div style={styles.canvasWorkflowNodeRail}>
                  <span style={styles.canvasWorkflowNodeIndex}>{String(idx + 1).padStart(2, '0')}</span>
                  {idx < canvasWorkflowNodes.length - 1 && <span style={styles.canvasWorkflowNodeLine} />}
                </div>
                <div style={styles.canvasWorkflowNodeBody} onWheel={event => event.stopPropagation()}>
                  <div style={styles.canvasWorkflowNodeContent}>
                    <div style={{ position: 'relative' as const, flexShrink: 0 }}>
                      <div
                        style={styles.canvasWorkflowPrompt}
                        onClick={() => setExpandedPromptNodeId(prev => prev === node.id ? null : node.id)}
                      >
                        {node.prompt}
                      </div>
                      {expandedPromptNodeId === node.id && (
                        <div data-prompt-popover style={styles.canvasPromptPopover} onClick={e => e.stopPropagation()}>
                          <div style={styles.canvasPromptPopoverHeader}>
                            <span style={styles.canvasPromptPopoverTitle}>{t('playground.canvas_prompt_label', { defaultValue: '提示词' })}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                type="button"
                                style={styles.canvasPromptPopoverBtn}
                                onClick={() => { void copyText(node.prompt).then(() => setInteractionNotice(t('playground.prompt_copied', { defaultValue: '提示词已复制' }))); setExpandedPromptNodeId(null); }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                <span>{t('playground.copy', { defaultValue: '复制' })}</span>
                              </button>
                              <button type="button" style={styles.canvasPromptPopoverCloseBtn} onClick={() => setExpandedPromptNodeId(null)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                              </button>
                            </div>
                          </div>
                          <div style={styles.canvasPromptPopoverBody}>{node.prompt}</div>
                        </div>
                      )}
                    </div>
                    {node.images.length > 0 ? (
                      <div style={styles.canvasWorkflowImageGrid}>
                        {node.images.map((image, imageIdx) => (
                          <button
                            key={`${image.messageId}-${image.imageIndex}`}
                            type="button"
                            style={styles.canvasWorkflowImageButton}
                            onClick={() => {
                              const globalIdx = globalImageIndexes[imageIdx];
                              if (globalIdx >= 0) showImagePreview(allConversationImages, globalIdx);
                            }}
                          >
                            <img src={image.url} alt={image.alt || node.prompt} style={styles.canvasWorkflowImage} loading="lazy" />
                          </button>
                        ))}
                      </div>
                    ) : node.status === 'failed' ? (
                      <div style={styles.canvasWorkflowFailedSlot}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4m0 4h.01" />
                        </svg>
                        <span>{node.errorMessage || t('playground.canvas_task_failed', { defaultValue: '生成失败，请重试' })}</span>
                      </div>
                    ) : (
                      <div style={styles.canvasWorkflowPendingSlot}>
                        <span style={styles.canvasTaskSpinner} />
                        <span>{node.status === 'processing'
                          ? t('playground.canvas_task_processing', { defaultValue: '正在生成图片，请稍候...' })
                          : t('playground.canvas_task_pending', { defaultValue: '排队中，等待生成...' })}</span>
                      </div>
                    )}
                    {node.assistantText && node.images.length === 0 && <div style={styles.canvasWorkflowText}>{node.assistantText}</div>}
                  </div>
                  <div style={styles.canvasWorkflowNodeMeta}>
                    <div style={styles.canvasWorkflowMetaStack}>
                      <span style={{
                        ...styles.canvasWorkflowStatus,
                        ...(node.status === 'completed' ? styles.canvasWorkflowStatusDone : node.status === 'failed' ? styles.canvasWorkflowStatusFailed : styles.canvasWorkflowStatusLive),
                      }}>
                        {node.status !== 'completed' && node.status !== 'failed' && <span style={styles.canvasWorkflowDot} />}
                        {statusLabel}
                      </span>
                      <span style={styles.canvasWorkflowTime}>{new Date(node.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ ...styles.canvasWorkflowMetaStack, ...styles.canvasWorkflowMetaStackEnd }}>
                      {node.model && <span style={styles.canvasWorkflowModel}>{node.model}</span>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {node.images.length > 0 && <span style={styles.canvasWorkflowOutputCount}>{node.images.length} output{node.images.length > 1 ? 's' : ''}</span>}
                        {(node.status === 'completed' || node.status === 'failed') && (
                          <button
                            type="button"
                            style={{ ...styles.canvasNodeRegenBtn, opacity: isStreaming ? 0.4 : 1 }}
                            disabled={isStreaming}
                            onClick={() => void regenerateCanvasNode(node)}
                            title={t('playground.canvas_regenerate', { defaultValue: '重新生成' })}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
                            <span>{t('playground.canvas_regenerate', { defaultValue: '重新生成' })}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}

          {isActiveConversationStreaming && canvasTaskStatus !== 'idle' && canvasWorkflowNodes.length === 0 && (
            <div style={styles.canvasTaskIndicator}>
              <div style={styles.canvasTaskSpinner} />
              <span style={styles.canvasTaskLabel}>
                {canvasTaskStatus === 'pending'
                  ? t('playground.canvas_task_pending', { defaultValue: '排队中，等待生成...' })
                  : t('playground.canvas_task_processing', { defaultValue: '正在生成图片，请稍候...' })}
              </span>
              <span style={styles.canvasTaskHint}>
                {t('playground.canvas_task_hint', { defaultValue: '可以刷新页面或关闭窗口，结果会自动保存' })}
              </span>
            </div>
          )}

          <div ref={canvasMode ? messagesEndRef : undefined} />
        </div>
      </div>
      )}

      {/* Spatial Canvas */}
      <div
        ref={canvasContainerRef}
        style={{
          ...styles.canvasGallery,
          ...(isMobile ? styles.canvasGalleryMobile : null),
          cursor: canvasPanningRef.current ? 'grabbing' : 'grab',
          backgroundSize: `${24 * canvasZoom}px ${24 * canvasZoom}px`,
          backgroundPosition: `${canvasPan.x}px ${canvasPan.y}px`,
        }}
        onWheel={handleCanvasWheel}
        onPointerDown={handleCanvasPanStart}
        onPointerMove={handleCanvasPanMove}
        onPointerUp={handleCanvasPanEnd}
        onPointerCancel={handleCanvasPanEnd}
      >
        {/* Zoom controls */}
        <div style={styles.canvasZoomControls}>
          <button type="button" style={styles.canvasZoomBtn} onClick={() => setCanvasZoom(z => Math.min(5, z * 1.2))} title="Zoom in">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <button type="button" style={styles.canvasZoomBtn} onClick={() => setCanvasZoom(z => Math.max(0.1, z * 0.8))} title="Zoom out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /></svg>
          </button>
          <button type="button" style={styles.canvasZoomBtn} onClick={resetCanvasView} title="Reset view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18" /></svg>
          </button>
          <span style={styles.canvasZoomLabel}>{Math.round(canvasZoom * 100)}%</span>
        </div>

        {allConversationImages.length === 0 ? (
          <div style={styles.canvasGalleryEmpty}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{t('playground.canvas_empty_title', { defaultValue: '还没有生成的图片' })}</div>
            <div style={{ fontSize: 12 }}>{t('playground.canvas_empty_description', { defaultValue: '发送消息开始创作，生成的图片将展示在这里' })}</div>
          </div>
        ) : (
          <div style={{
            ...styles.canvasSpatial,
            transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`,
          }}>
            {allConversationImages.map((img, idx) => {
              const key = imageKey(img);
              const pos = getImagePos(img, idx, allConversationImages.length);
              const isDragging = draggingKey === key;
              return (
                <div
                  key={key}
                  className="pg-canvas-card"
                  style={{
                    ...styles.canvasGalleryCard,
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                    width: CARD_W,
                    zIndex: isDragging ? 10 : 1,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    boxShadow: isDragging ? '0 16px 48px rgba(0,0,0,0.4)' : undefined,
                    transition: isDragging ? 'none' : 'box-shadow 0.15s',
                  }}
                  onPointerDown={e => handleCardPointerDown(e, img, idx, allConversationImages.length)}
                  onPointerMove={handleCardPointerMove}
                  onPointerUp={handleCardPointerUp}
                  onPointerCancel={handleCardPointerUp}
                >
                  <button
                    type="button"
                    style={styles.canvasGalleryThumb}
                    onClick={() => showImagePreview(allConversationImages, idx)}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || img.prompt}
                      style={styles.canvasGalleryImg}
                      loading="lazy"
                    />
                  </button>
                  <div className="pg-canvas-actions" style={styles.canvasGalleryActions}>
                    {renderImageDownloadButton(img, true)}
                    {renderImageEditButton(img, img.model, selectedPlatform || undefined, true)}
                  </div>
                  <div style={styles.canvasGalleryFooter}>
                    {img.prompt && <div style={styles.canvasGalleryPrompt} title={img.prompt}>{img.prompt}</div>}
                    {img.model && <span style={styles.canvasGalleryMeta}>{img.model}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Input (canvas view) */}
        <div
          style={{
            ...styles.inputArea,
            ...(isMobile ? styles.inputAreaMobile : null),
            ...styles.canvasWorkflowInput,
          }}
          onPointerDown={event => event.stopPropagation()}
          onWheel={event => event.stopPropagation()}
        >
          <div style={{
            ...styles.inputWrapper,
            ...(isMobile ? styles.inputWrapperMobile : null),
            ...(isActiveConversationStreaming ? styles.inputWrapperStreaming : null),
            ...({ maxWidth: '100%', borderRadius: 16 }),
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
                      ×
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
              onFocus={() => { if (!activeId) createCanvasConversation(); }}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder={t('playground.canvas_input_placeholder', { defaultValue: '描述你想创作的内容...（按 Enter 发送，Shift+Enter 换行）' })}
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
          </div>
        </div>
      </div>

      {interactionNotice && (
        <div style={styles.canvasInteractionNotice}>{interactionNotice}</div>
      )}
    </div>
  );
}
