// 跨会话恢复条 (hasRecoverableUserMessage) 的门控回归。
// 覆盖:重开后末位是提问才显示、发送中/流式中不误闪、有错误时让位错误条、
// 空会话与无激活会话不显示。见 ChatView 恢复条与 PlaygroundContext 发送闸门。
import { describe, it, expect } from 'vitest';
import { isTailRecoverable } from '../utils';

const idle = {
  activeId: 5,
  isStreaming: false,
  isSubmitting: false,
  hasError: false,
  lastRole: 'user' as string | undefined,
};

describe('isTailRecoverable — 跨会话恢复条门控', () => {
  it('重开/刷新后末位仍是用户提问且空闲 → 显示', () => {
    expect(isTailRecoverable(idle)).toBe(true);
  });

  it('末位是助手回复 → 不显示', () => {
    expect(isTailRecoverable({ ...idle, lastRole: 'assistant' })).toBe(false);
  });

  it('空会话(无消息,lastRole undefined) → 不显示', () => {
    expect(isTailRecoverable({ ...idle, lastRole: undefined })).toBe(false);
  });

  it('流式作答中 → 不显示', () => {
    expect(isTailRecoverable({ ...idle, isStreaming: true })).toBe(false);
  });

  it('发送中(挡掉「落库→起流」空档的误闪) → 不显示', () => {
    expect(isTailRecoverable({ ...idle, isSubmitting: true })).toBe(false);
  });

  it('存在实时错误 → 让位给错误条,不并存', () => {
    expect(isTailRecoverable({ ...idle, hasError: true })).toBe(false);
  });

  it('无激活会话 → 不显示', () => {
    expect(isTailRecoverable({ ...idle, activeId: null })).toBe(false);
  });
});
