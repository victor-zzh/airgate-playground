import { describe, expect, it } from 'vitest';
import {
  formatByteSize,
  messageContentWithAttachments,
  splitFileBlocks,
  stripFileBlocks,
  titleFromMessageContent,
} from '../../utils';

describe('messageContentWithAttachments', () => {
  it('wraps files in <file> blocks with truncated attribute', () => {
    const content = messageContentWithAttachments('question', [], [{
      id: '1',
      name: 'a"b.txt',
      content: 'file body',
      size: 9,
      type: 'text/plain',
      truncated: true,
    }]);
    expect(content).toContain('question');
    expect(content).toContain('<file name="a&quot;b.txt" type="text/plain" size="9" truncated="true">');
    expect(content).toContain('file body');
    expect(content).toContain('</file>');
  });
});

describe('messageContentWithAttachments escaping', () => {
  it('escapes literal </file> in content so the block round-trips', () => {
    const content = messageContentWithAttachments('q', [], [{
      id: '1',
      name: 'sample.xml',
      content: 'before\n</file>\nafter',
      size: 20,
      type: 'text/xml',
    }]);
    const segments = splitFileBlocks(content);
    const fileSegment = segments.find(segment => segment.kind === 'file');
    if (!fileSegment || fileSegment.kind !== 'file') throw new Error('expected file segment');
    expect(fileSegment.block.content).toContain('after');
    expect(segments.filter(segment => segment.kind === 'file')).toHaveLength(1);
  });
});

describe('splitFileBlocks', () => {
  it('splits text and file segments and unescapes attributes', () => {
    const content = 'ask\n\n<file name="a&quot;b.txt" type="text/plain" size="9" truncated="true">\nbody\n</file>\n\ntail';
    const segments = splitFileBlocks(content);
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ kind: 'text', text: 'ask' });
    const fileSegment = segments[1];
    if (fileSegment.kind !== 'file') throw new Error('expected file segment');
    expect(fileSegment.block.name).toBe('a"b.txt');
    expect(fileSegment.block.size).toBe(9);
    expect(fileSegment.block.truncated).toBe(true);
    expect(fileSegment.block.content).toBe('body');
    expect(segments[2]).toEqual({ kind: 'text', text: 'tail' });
  });

  it('returns a single text segment when no file blocks exist', () => {
    expect(splitFileBlocks('plain message')).toEqual([{ kind: 'text', text: 'plain message' }]);
  });
});

describe('stripFileBlocks / titleFromMessageContent', () => {
  it('replaces blocks with a compact marker for titles', () => {
    const content = messageContentWithAttachments('summarize this', [], [{
      id: '1',
      name: 'report.pdf',
      content: 'x'.repeat(1000),
      size: 1000,
      type: 'application/pdf',
    }]);
    expect(stripFileBlocks(content)).toContain('[文件: report.pdf]');
    expect(titleFromMessageContent(content).startsWith('summarize this')).toBe(true);
  });
});

describe('formatByteSize', () => {
  it('formats bytes at sensible precision', () => {
    expect(formatByteSize(500)).toBe('500B');
    expect(formatByteSize(2048)).toBe('2.0KB');
    expect(formatByteSize(3.5 * 1024 * 1024)).toBe('3.5MB');
    expect(formatByteSize(0)).toBe('');
  });
});
