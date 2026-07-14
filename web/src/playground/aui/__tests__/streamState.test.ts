import { describe, expect, it } from 'vitest';
import { appendStreamPart, streamPartsText, type StreamPart } from '../streamState';

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
