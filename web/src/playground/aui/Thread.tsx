// 消息列表骨架：ThreadPrimitive.Root + Viewport（autoScroll，保持"钉在底部才
// 跟随"的阅读手感）+ Messages + 跳到底部胶囊（贴底时 primitives 自动 disabled，
// CSS 隐藏）。errorBar/interactionNotice 由 ChatView 经 children
// 传入，保持原来在滚动容器内、消息之后的文档流位置。
import type { ReactNode } from 'react';
import { ThreadPrimitive } from '@assistant-ui/react';
import { usePlayground } from '../PlaygroundContext';
import { styles } from '../styles';
import { MessageItem } from './MessageItem';

const MESSAGE_COMPONENTS = { Message: MessageItem };

export function Thread({ children }: { children?: ReactNode }) {
  const { t } = usePlayground();
  return (
    <ThreadPrimitive.Root style={styles.threadRoot}>
      <ThreadPrimitive.Viewport style={styles.messagesArea} autoScroll>
        <ThreadPrimitive.Messages components={MESSAGE_COMPONENTS} />

        {children}

        <div className="pg-jump-bottom-wrap" style={styles.jumpToBottomWrap}>
          <ThreadPrimitive.ScrollToBottom
            className="pg-jump-bottom"
            behavior="smooth"
            style={styles.jumpToBottomBtn}
            aria-label={t('playground.jump_to_bottom')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14" />
              <path d="m19 12-7 7-7-7" />
            </svg>
            {t('playground.jump_to_bottom')}
          </ThreadPrimitive.ScrollToBottom>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}
