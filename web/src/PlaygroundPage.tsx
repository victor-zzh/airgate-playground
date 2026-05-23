import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cssVar, getStoredTheme, setTheme, type ThemeName } from '@doudou-start/airgate-theme';
import { PlaygroundProvider, usePlayground } from './playground/PlaygroundContext';
import { ChatView } from './playground/ChatView';
import { styles, keyframes } from './playground/styles';

export function ChatPage() {
  return (
    <PlaygroundProvider>
      <ChatShell />
    </PlaygroundProvider>
  );
}

export default ChatPage;

type BreadcrumbItem = {
  href?: string;
  label: string;
};

function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumbs" style={styles.breadcrumbs}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${index}-${item.label}`} style={styles.breadcrumbItem}>
            {item.href && !isLast ? (
              <a href={item.href} style={styles.breadcrumbLink} className="pg-sidebar-link">
                {item.label}
              </a>
            ) : (
              <span style={styles.breadcrumbCurrent}>{item.label}</span>
            )}
            {!isLast && <span aria-hidden="true" style={styles.breadcrumbSeparator}>/</span>}
          </span>
        );
      })}
    </nav>
  );
}

function ChatShell() {
  const { t, i18n } = useTranslation();
  const {
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    activeId,
    userInfo,
    sidebarConversations,
    createConversation,
    openConversation,
    deleteConversation,
  } = usePlayground();
  const [theme, setThemeState] = useState<ThemeName>(() => getStoredTheme());

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'zh' ? 'en' : 'zh';
    void i18n.changeLanguage(nextLang);
    try {
      window.localStorage.setItem('lang', nextLang);
    } catch {
      // Language switching should keep working when storage is unavailable.
    }
  };

  const toggleTheme = () => {
    const next: ThemeName = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('light', next === 'light');
    document.documentElement.classList.toggle('dark', next === 'dark');
    setThemeState(next);
  };

  const logout = () => {
    try {
      window.localStorage.removeItem('token');
      window.sessionStorage.removeItem('apikey_session_secret');
    } catch {
      // Logout should still redirect when storage is unavailable.
    }
    window.location.href = '/login';
  };

  const displayName = userInfo?.username || userInfo?.email?.split('@')[0] || 'User';
  const isAdmin = userInfo?.role === 'admin';

  return (
    <div data-full-bleed data-pg-aesthetic style={styles.layout}>
      {sidebarOpen && isMobile && (
        <div style={styles.sidebarBackdrop} onClick={() => setSidebarOpen(false)} />
      )}

      <ImagePreviewOverlay />

      {sidebarOpen ? (
        <div style={{ ...styles.sidebar, ...(isMobile ? styles.sidebarMobile : null) }}>
          <div style={styles.sidebarHeader}>
            <div style={styles.sidebarTopbar}>
              <Breadcrumbs
                items={[
                  { href: '/', label: t('playground.console', { defaultValue: '控制台' }) },
                  { label: t('playground.title', { defaultValue: 'AI 对话' }) },
                ]}
              />
              <button
                style={styles.toggleBtn}
                className="pg-sidebar-collapse-button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Collapse conversations"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            </div>
            <button
              style={styles.newBtn}
              className="pg-sidebar-action"
              onClick={createConversation}
              title={t('playground.new_conversation')}
              aria-label={t('playground.new_conversation')}
            >
              <span style={styles.newBtnIcon}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M7 1v12M1 7h12" />
                </svg>
              </span>
              <span>{t('playground.new_conversation')}</span>
            </button>
          </div>

          <div style={styles.convList}>
            {sidebarConversations.map(conversation => {
              const isActive = conversation.id === activeId;
              return (
                <div
                  key={conversation.id}
                  className={`pg-conv-item${isActive ? ' is-active' : ''}`}
                  style={{ ...styles.convItem, ...(isActive ? styles.convItemActive : null) }}
                  onClick={() => openConversation(conversation.id)}
                >
                  <span style={{ ...styles.convIcon, color: isActive ? cssVar('text') : cssVar('textTertiary') }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                    </svg>
                  </span>
                  <span style={{ ...styles.convTitle, color: isActive ? cssVar('text') : cssVar('textSecondary'), fontWeight: isActive ? 500 : 400 }}>
                    {conversation.title || t('playground.new_conversation')}
                  </span>
                  <button
                    type="button"
                    className="pg-conv-delete"
                    style={styles.deleteBtn}
                    onClick={(event) => { event.stopPropagation(); void deleteConversation(conversation.id); }}
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
          <button style={styles.toggleBtn} className="pg-sidebar-collapse-button" onClick={() => setSidebarOpen(true)} aria-label="Expand conversations">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      <div style={styles.main}>
        <header style={styles.topbar} className="pg-topbar">
          <div style={styles.topbarLeft} />
          <div style={styles.topbarRight}>
            <button
              type="button"
              style={styles.topbarTextBtn}
              className="pg-topbar-button"
              onClick={toggleLanguage}
              aria-label={i18n.language === 'zh' ? 'Switch to English' : '切换为中文'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" />
              </svg>
              <span style={styles.topbarLangText} className="pg-topbar-lang-text">{i18n.language === 'zh' ? 'EN' : '中文'}</span>
            </button>
            <button
              type="button"
              style={styles.topbarIconBtn}
              className="pg-topbar-button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? '切换亮色模式' : '切换暗色模式'}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>
            {userInfo && (
              <>
                <div style={styles.topbarDivider} />
                <div style={styles.topbarUser}>
                  <div style={styles.topbarUserText} className="pg-topbar-user-text">
                    <div style={styles.topbarUserName}>{displayName}</div>
                    <div style={styles.topbarUserEmail}>{userInfo.email}</div>
                  </div>
                  <div style={{ ...styles.topbarAvatar, ...(isAdmin ? styles.topbarAdminAvatar : null) }}>
                    {isAdmin ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.68-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
              </>
            )}
            <div style={styles.topbarDivider} />
            <button
              type="button"
              style={{ ...styles.topbarIconBtn, ...styles.topbarLogoutBtn }}
              className="pg-topbar-button pg-topbar-logout"
              onClick={logout}
              aria-label={t('common.logout', { defaultValue: '退出登录' })}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
              </svg>
            </button>
          </div>
        </header>
        <ChatView />
      </div>

      <style>{keyframes}</style>
    </div>
  );
}

function ImagePreviewOverlay() {
  const { t } = useTranslation();
  const { previewImage, setPreviewImage, showNextPreviewImage } = usePlayground();

  if (!previewImage) return null;
  const current = previewImage.images[previewImage.index] || previewImage.images[0];
  if (!current) return null;
  const hasNav = previewImage.images.length > 1;

  return (
    <div style={styles.imagePreviewOverlay} role="dialog" aria-modal="true" aria-label={current.alt || t('playground.image_preview')} onClick={() => setPreviewImage(null)}>
      <div style={styles.imagePreviewModal} onClick={event => event.stopPropagation()}>
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
