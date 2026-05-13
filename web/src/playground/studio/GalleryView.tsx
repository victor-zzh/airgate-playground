import { type CSSProperties, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStudio } from './StudioContext';
import type { GalleryItem, StudioGenerationTask } from './types';
import { studioStyles as ss } from './studioStyles';
import { downloadImage } from '../utils';

// ── TaskCard ──────────────────────────────────────────────────────────────────

const taskCardStyles: Record<string, CSSProperties> = {
  card: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    aspectRatio: '1 / 1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
  },
  spinner: {
    width: 28,
    height: 28,
    border: '2.5px solid rgba(255,255,255,0.12)',
    borderTopColor: 'rgba(255,255,255,0.7)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  },
  failedIcon: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '2.5px solid rgba(248,113,113,0.5)',
    color: '#f87171',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
  },
  prompt: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
  },
};

function TaskCard({ task }: { task: StudioGenerationTask }) {
  const { t } = useTranslation();

  const statusLabel = task.status === 'queued'
    ? t('playground.studio_task_queued', { defaultValue: '队列中...' })
    : task.status === 'failed'
      ? t('playground.studio_task_failed', { defaultValue: '生成失败' })
      : t('playground.studio_task_processing', { defaultValue: '生成中...' });

  return (
    <div style={taskCardStyles.card}>
      {task.status === 'failed' ? (
        <div style={taskCardStyles.failedIcon}>!</div>
      ) : (
        <div style={taskCardStyles.spinner} />
      )}
      <div style={taskCardStyles.statusLabel}>{statusLabel}</div>
      {task.status === 'failed' && task.error && (
        <div style={taskCardStyles.prompt}>{task.error}</div>
      )}
      {task.prompt && (
        <div style={taskCardStyles.prompt}>{task.prompt}</div>
      )}
    </div>
  );
}

// ── GalleryCard ───────────────────────────────────────────────────────────────

function GalleryCard({ item }: { item: GalleryItem }) {
  const { t } = useTranslation();
  const { setPreviewItem, deleteGalleryItem, useAsReference } = useStudio();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    void downloadImage(item.url, item.alt);
  };

  const handleUseAsReference = (e: React.MouseEvent) => {
    e.stopPropagation();
    useAsReference(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteGalleryItem(item.id);
  };

  return (
    <div
      style={ss.galleryCard}
      onClick={() => setPreviewItem(item)}
      className="studio-gallery-card"
    >
      <img
        src={item.url}
        alt={item.alt || item.prompt}
        style={ss.galleryCardImg}
        loading="lazy"
      />
      <div style={ss.galleryCardOverlay} className="studio-gallery-overlay">
        {item.prompt && (
          <div style={ss.galleryCardPrompt}>{item.prompt}</div>
        )}
        <div style={ss.galleryCardActions}>
          <button
            type="button"
            style={ss.galleryCardActionBtn}
            onClick={handleDownload}
            title={t('playground.studio_download', { defaultValue: '下载' })}
          >
            {t('playground.studio_download', { defaultValue: '下载' })}
          </button>
          <button
            type="button"
            style={ss.galleryCardActionBtn}
            onClick={handleUseAsReference}
            title={t('playground.studio_use_as_reference', { defaultValue: '参考图' })}
          >
            {t('playground.studio_use_as_reference', { defaultValue: '参考图' })}
          </button>
          <button
            type="button"
            style={ss.galleryCardActionBtn}
            onClick={handleDelete}
            title={t('playground.studio_delete', { defaultValue: '删除' })}
          >
            {t('playground.studio_delete', { defaultValue: '删除' })}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PreviewOverlay ────────────────────────────────────────────────────────────

function PreviewOverlay() {
  const { t } = useTranslation();
  const { previewItem, setPreviewItem } = useStudio();

  // Close on Escape key
  useEffect(() => {
    if (!previewItem) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewItem(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [previewItem, setPreviewItem]);

  if (!previewItem) return null;

  const handleDownload = () => {
    void downloadImage(previewItem.url, previewItem.alt);
  };

  return (
    <div
      style={ss.previewOverlay}
      onClick={() => setPreviewItem(null)}
      role="dialog"
      aria-modal="true"
      aria-label={t('playground.studio_preview', { defaultValue: '图片预览' })}
    >
      {/* Close button */}
      <button
        type="button"
        style={ss.previewOverlayClose}
        onClick={() => setPreviewItem(null)}
        aria-label={t('playground.studio_close', { defaultValue: '关闭' })}
      >
        ×
      </button>

      {/* Image */}
      <img
        src={previewItem.url}
        alt={previewItem.alt || previewItem.prompt}
        style={ss.previewOverlayImg}
        onClick={e => e.stopPropagation()}
      />

      {/* Meta */}
      {(previewItem.prompt || previewItem.model) && (
        <div style={ss.previewOverlayMeta} onClick={e => e.stopPropagation()}>
          {previewItem.prompt && <div>{previewItem.prompt}</div>}
          {previewItem.model && (
            <div style={{ marginTop: 4, opacity: 0.6, fontSize: 11 }}>{previewItem.model}</div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={ss.previewOverlayActions} onClick={e => e.stopPropagation()}>
        <button
          type="button"
          style={ss.previewOverlayBtn}
          onClick={handleDownload}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t('playground.studio_download', { defaultValue: '下载' })}
        </button>
        <button
          type="button"
          style={ss.previewOverlayBtn}
          onClick={() => setPreviewItem(null)}
        >
          {t('playground.studio_close', { defaultValue: '关闭' })}
        </button>
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

const emptyIconStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.04)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 4,
};

const emptyHintStyle: CSSProperties = {
  fontSize: 12,
  marginTop: 4,
  opacity: 0.6,
};

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div style={ss.galleryEmpty}>
      <div style={emptyIconStyle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.4}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
      <div>{t('playground.studio_gallery_empty', { defaultValue: '还没有生成的图片' })}</div>
      <div style={emptyHintStyle}>
        {t('playground.studio_gallery_empty_hint', { defaultValue: '输入提示词开始创作' })}
      </div>
    </div>
  );
}

// ── Hover CSS injection ───────────────────────────────────────────────────────

const hoverStyles = `
  .studio-gallery-card:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
    transform: translateY(-2px);
  }
  .studio-gallery-card:hover .studio-gallery-overlay {
    opacity: 1;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// ── GalleryView ───────────────────────────────────────────────────────────────

export function GalleryView() {
  const { gallery, tasks, previewItem } = useStudio();

  const visibleTasks = tasks.filter(t => t.status !== 'completed');
  const isEmpty = gallery.length === 0 && visibleTasks.length === 0;

  return (
    <div style={ss.gallery}>
      <style>{hoverStyles}</style>

      {/* Preview overlay (fullscreen) */}
      {previewItem && <PreviewOverlay />}

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div style={ss.galleryGrid}>
          {/* Visible tasks at the top */}
          {visibleTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}

          {/* Gallery items */}
          {gallery.map(item => (
            <GalleryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

