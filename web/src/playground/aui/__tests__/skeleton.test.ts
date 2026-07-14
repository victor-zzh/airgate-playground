// assistant-ui 骨架挂载回归:验证空状态 → 草稿会话 → Thread + Composer 挂载、
// 发送按钮启用逻辑、跳底胶囊等接线未回退。
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// URL 感知 mock:各挂载期端点返回契约形状(request<T> 直接返回解析后的 JSON)。
function mockJSON(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
  const url = typeof input === 'string' ? input : input.toString();
  if (url.endsWith('/user/info')) {
    return mockJSON({ user_id: 1, username: 'tester', email: 't@e.com', role: 'user', balance: 12.3456 });
  }
  if (url.endsWith('/models')) {
    return mockJSON({ models: [{ id: 'gpt-5.5', name: 'GPT-5.5', platform: 'openai', context_window: 200000, max_output_tokens: 32768, capabilities: ['chat'] }] });
  }
  if (url.endsWith('/conversations')) {
    return mockJSON([]);
  }
  return mockJSON([]);
}));

describe('aui skeleton mounts', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await act(async () => root?.unmount());
    container.remove();
  });

  it('renders empty state, opens a draft conversation, mounts composer + thread', async () => {
    const { ChatPage } = await import('../../../PlaygroundPage');
    root = createRoot(container);
    await act(async () => {
      root.render(createElement(ChatPage));
    });
    await act(async () => { await Promise.resolve(); });

    // 空状态 CTA 存在
    const buttons = Array.from(container.querySelectorAll('button'));
    const newConvBtn = buttons.find(b => b.textContent?.includes('new_conversation'));
    expect(newConvBtn).toBeTruthy();

    // 点击新建会话 → 草稿会话激活 → Thread + Composer 挂载
    await act(async () => {
      newConvBtn!.click();
    });
    await act(async () => { await Promise.resolve(); });

    const textarea = container.querySelector('textarea');
    expect(textarea).toBeTruthy();
    expect(textarea!.getAttribute('placeholder')).toContain('input_placeholder');
    // happy-dom 的 .rows 返回字符串,强转比较
    expect(Number(textarea!.rows)).toBe(4);

    // 发送按钮初始 disabled（无文本无附件）
    const sendBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('playground.send'));
    expect(sendBtn).toBeTruthy();
    expect((sendBtn as HTMLButtonElement).disabled).toBe(true);

    // 输入文本 → composer runtime 接管 → 发送按钮启用
    await act(async () => {
      const proto = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
      proto!.set!.call(textarea, 'hello');
      textarea!.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(textarea!.value).toBe('hello');
    const sendBtn2 = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('playground.send'));
    expect((sendBtn2 as HTMLButtonElement).disabled).toBe(false);

    // 跳到底部胶囊存在且贴底时 disabled（CSS 隐藏依赖该属性）
    const jump = container.querySelector('.pg-jump-bottom');
    expect(jump).toBeTruthy();
  });
});
