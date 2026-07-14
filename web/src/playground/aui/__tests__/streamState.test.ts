import { describe, expect, it } from 'vitest';
import { appendStreamPart, streamPartsText, upsertToolPart, isToolPart, type StreamPart, type StreamToolPart } from '../streamState';

describe('appendStreamPart', () => {
  it('starts with a reasoning part when reasoning arrives first', () => {
    const parts = appendStreamPart([], 'reasoning', '思考中');
    expect(parts).toEqual([{ kind: 'reasoning', text: '思考中' }]);
  });

  it('merges consecutive deltas of the same kind into the last part', () => {
    let parts: readonly StreamPart[] = [];
    parts = appendStreamPart(parts, 'text', 'Hello');
    parts = appendStreamPart(parts, 'text', ', world');
    expect(parts).toEqual([{ kind: 'text', text: 'Hello, world' }]);
  });

  it('keeps reasoning-first ordering when text follows reasoning', () => {
    let parts: readonly StreamPart[] = [];
    parts = appendStreamPart(parts, 'reasoning', 'think-1');
    parts = appendStreamPart(parts, 'reasoning', ' think-2');
    parts = appendStreamPart(parts, 'text', 'answer');
    expect(parts).toEqual([
      { kind: 'reasoning', text: 'think-1 think-2' },
      { kind: 'text', text: 'answer' },
    ]);
  });

  it('opens a new part when kinds interleave', () => {
    let parts: readonly StreamPart[] = [];
    parts = appendStreamPart(parts, 'reasoning', 'r1');
    parts = appendStreamPart(parts, 'text', 't1');
    parts = appendStreamPart(parts, 'reasoning', 'r2');
    parts = appendStreamPart(parts, 'text', 't2');
    expect(parts).toEqual([
      { kind: 'reasoning', text: 'r1' },
      { kind: 'text', text: 't1' },
      { kind: 'reasoning', text: 'r2' },
      { kind: 'text', text: 't2' },
    ]);
  });

  it('does not mutate the previous parts array', () => {
    const before: readonly StreamPart[] = [{ kind: 'text', text: 'a' }];
    const after = appendStreamPart(before, 'text', 'b');
    expect(before).toEqual([{ kind: 'text', text: 'a' }]);
    expect(after).not.toBe(before);
  });

  it('returns the same array reference for empty deltas', () => {
    const before: readonly StreamPart[] = [{ kind: 'text', text: 'a' }];
    expect(appendStreamPart(before, 'text', '')).toBe(before);
    expect(appendStreamPart(before, 'reasoning', '')).toBe(before);
  });
});

describe('streamPartsText', () => {
  it('concatenates all parts of one kind across interleaving', () => {
    const parts: readonly StreamPart[] = [
      { kind: 'reasoning', text: 'r1' },
      { kind: 'text', text: 't1' },
      { kind: 'reasoning', text: 'r2' },
    ];
    expect(streamPartsText(parts, 'reasoning')).toBe('r1r2');
    expect(streamPartsText(parts, 'text')).toBe('t1');
  });
});

describe('upsertToolPart', () => {
  it('appends a running tool part on start', () => {
    const parts = upsertToolPart([{ kind: 'text', text: 'hi' }], { id: 't1', name: 'web_search', args: { query: 'x' } });
    expect(parts).toHaveLength(2);
    const tool = parts[1] as StreamToolPart;
    expect(tool).toMatchObject({ kind: 'tool', id: 't1', name: 'web_search', status: 'running', args: { query: 'x' } });
  });

  it('updates status/result in place by id, preserving position (text/tool interleave)', () => {
    let parts: readonly StreamPart[] = [];
    parts = appendStreamPart(parts, 'text', '先搜索');
    parts = upsertToolPart(parts, { id: 't1', name: 'web_search', args: { query: 'x' } });
    parts = appendStreamPart(parts, 'text', '再补充'); // 交错文本
    parts = upsertToolPart(parts, { id: 't1', name: 'web_search', status: 'complete', result: { sources: [{ index: 1 }] } });
    // 位置不变（仍在两段文本之间），状态与结果就地更新
    expect(parts).toHaveLength(3);
    const tool = parts[1] as StreamToolPart;
    expect(tool.status).toBe('complete');
    expect(tool.result).toEqual({ sources: [{ index: 1 }] });
    expect((parts[0] as { text: string }).text).toBe('先搜索');
    expect((parts[2] as { text: string }).text).toBe('再补充');
  });

  it('tracks error status', () => {
    let parts = upsertToolPart([], { id: 't1', name: 'web_search' });
    parts = upsertToolPart(parts, { id: 't1', name: 'web_search', status: 'error', error: '上限' });
    const tool = parts[0] as StreamToolPart;
    expect(tool.status).toBe('error');
    expect(tool.error).toBe('上限');
  });

  it('isToolPart discriminates', () => {
    expect(isToolPart({ kind: 'tool', id: 'a', name: 'b', status: 'running' })).toBe(true);
    expect(isToolPart({ kind: 'text', text: 'x' })).toBe(false);
  });
});
