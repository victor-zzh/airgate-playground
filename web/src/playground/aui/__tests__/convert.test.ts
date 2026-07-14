import { describe, expect, it } from 'vitest';
import type { Message } from '../../types';
import {
  AUI_STREAMING_MESSAGE_ID,
  convertAuiMessage,
  isStreamingDraft,
  persistedToolCallsFromStream,
  streamingDraftToThreadMessageLike,
  toThreadMessageLike,
  type StreamingDraftMessage,
} from '../convert';

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 42,
    conversation_id: 7,
    role: 'assistant',
    content: 'Hello **world**',
    platform: 'claude',
    model: 'claude-sonnet-4-5',
    group_id: 3,
    input_tokens: 12,
    output_tokens: 34,
    cost: 0.0021,
    created_at: '2026-07-14T08:00:00Z',
    ...overrides,
  };
}

describe('toThreadMessageLike', () => {
  it('maps id/role/createdAt and keeps content as a single text part', () => {
    const like = toThreadMessageLike(makeMessage());
    expect(like.id).toBe('42');
    expect(like.role).toBe('assistant');
    expect(like.createdAt).toEqual(new Date('2026-07-14T08:00:00Z'));
    expect(like.content).toEqual([{ type: 'text', text: 'Hello **world**' }]);
  });

  it('does not split image markdown or <file> blocks into separate parts', () => {
    const content = '看图\n\n<file name="a.txt" type="text/plain" size="3">\nabc\n</file>\n\n![img](/assets-runtime/x.png)';
    const like = toThreadMessageLike(makeMessage({ role: 'user', content }));
    expect(like.content).toEqual([{ type: 'text', text: content }]);
  });

  it('prepends a reasoning part when msg.reasoning is non-empty', () => {
    const like = toThreadMessageLike(makeMessage({ reasoning: 'let me think' }));
    expect(like.content).toEqual([
      { type: 'reasoning', text: 'let me think' },
      { type: 'text', text: 'Hello **world**' },
    ]);
  });

  it('omits the reasoning part when reasoning is empty', () => {
    const like = toThreadMessageLike(makeMessage({ reasoning: '' }));
    expect(like.content).toEqual([{ type: 'text', text: 'Hello **world**' }]);
  });

  it('carries usage/model/platform into metadata.custom', () => {
    const like = toThreadMessageLike(makeMessage({ reasoning_effort: 'high' }));
    expect(like.metadata?.custom).toEqual({
      model: 'claude-sonnet-4-5',
      platform: 'claude',
      cost: 0.0021,
      input_tokens: 12,
      output_tokens: 34,
      reasoning_effort: 'high',
    });
  });

  it('normalizes unknown roles to user', () => {
    const like = toThreadMessageLike(makeMessage({ role: 'tool' }));
    expect(like.role).toBe('user');
  });
});

describe('streamingDraftToThreadMessageLike', () => {
  const draft: StreamingDraftMessage = {
    auiStreamingDraft: true,
    parts: [
      { kind: 'reasoning', text: 'thinking...' },
      { kind: 'text', text: 'partial answer' },
    ],
  };

  it('uses the fixed streaming id and running status', () => {
    const like = streamingDraftToThreadMessageLike(draft);
    expect(like.id).toBe(AUI_STREAMING_MESSAGE_ID);
    expect(like.role).toBe('assistant');
    expect(like.status).toEqual({ type: 'running' });
    expect(like.metadata?.custom).toEqual({ streaming: true });
  });

  it('maps stream parts to reasoning/text parts in arrival order', () => {
    const like = streamingDraftToThreadMessageLike(draft);
    expect(like.content).toEqual([
      { type: 'reasoning', text: 'thinking...' },
      { type: 'text', text: 'partial answer' },
    ]);
  });

  it('yields empty content before the first delta arrives', () => {
    const like = streamingDraftToThreadMessageLike({ auiStreamingDraft: true, parts: [] });
    expect(like.content).toEqual([]);
  });
});

describe('tool-call mapping', () => {
  it('history order: reasoning → all tool cards → text', () => {
    const like = toThreadMessageLike(makeMessage({
      reasoning: 'plan',
      content: '答案',
      tool_calls: [
        { id: 't1', name: 'web_search', status: 'complete', args: { query: 'x' }, result: { sources: [] } },
        { id: 't2', name: 'generate_document', status: 'complete', result: { file: { name: 'r.pdf' } } },
      ],
    }));
    const types = (like.content as unknown as Array<{ type: string }>).map(p => p.type);
    expect(types).toEqual(['reasoning', 'tool-call', 'tool-call', 'text']);
    const firstTool = (like.content as unknown as Array<Record<string, unknown>>)[1];
    expect(firstTool).toMatchObject({ type: 'tool-call', toolCallId: 't1', toolName: 'web_search', isError: false });
  });

  it('maps error tool call with isError and error result', () => {
    const like = toThreadMessageLike(makeMessage({
      content: '',
      tool_calls: [{ id: 't1', name: 'web_search', status: 'error', error: '上限' }],
    }));
    const tool = (like.content as unknown as Array<Record<string, unknown>>)[0];
    expect(tool).toMatchObject({ type: 'tool-call', isError: true, result: { error: '上限' } });
  });

  it('streaming draft preserves text/tool interleave order', () => {
    const like = streamingDraftToThreadMessageLike({
      auiStreamingDraft: true,
      parts: [
        { kind: 'text', text: '先搜索' },
        { kind: 'tool', id: 't1', name: 'web_search', status: 'complete', result: { sources: [] } },
        { kind: 'text', text: '结论' },
      ],
    });
    const types = (like.content as unknown as Array<{ type: string }>).map(p => p.type);
    expect(types).toEqual(['text', 'tool-call', 'text']);
  });

  it('persistedToolCallsFromStream extracts finished tool records', () => {
    const persisted = persistedToolCallsFromStream([
      { kind: 'text', text: 'x' },
      { kind: 'tool', id: 't1', name: 'web_search', status: 'complete', result: { sources: [] } },
      { kind: 'tool', id: 't2', name: 'generate_document', status: 'error', error: 'boom' },
    ]);
    expect(persisted).toEqual([
      { id: 't1', name: 'web_search', status: 'complete', args: undefined, result: { sources: [] }, error: undefined },
      { id: 't2', name: 'generate_document', status: 'error', args: undefined, result: undefined, error: 'boom' },
    ]);
  });
});

describe('convertAuiMessage', () => {
  it('discriminates streaming drafts from persisted messages', () => {
    const draft: StreamingDraftMessage = { auiStreamingDraft: true, parts: [] };
    expect(isStreamingDraft(draft)).toBe(true);
    expect(isStreamingDraft(makeMessage())).toBe(false);
    expect(convertAuiMessage(draft).id).toBe(AUI_STREAMING_MESSAGE_ID);
    expect(convertAuiMessage(makeMessage()).id).toBe('42');
  });

  it('returns a referentially stable result per message object (WeakMap cache)', () => {
    const msg = makeMessage();
    const first = convertAuiMessage(msg);
    const second = convertAuiMessage(msg);
    expect(second).toBe(first);
    // 不同对象（即使内容一致）各自转换，互不串缓存
    expect(convertAuiMessage(makeMessage())).not.toBe(first);
  });
});
