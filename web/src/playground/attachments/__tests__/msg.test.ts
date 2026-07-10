import { describe, expect, it } from 'vitest';
import { extractMsgFields, parseMsgDate } from '../msg';

function u16(s: string): Uint8Array {
  const out = new Uint8Array(s.length * 2);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    out[i * 2] = c & 0xff;
    out[i * 2 + 1] = c >> 8;
  }
  return out;
}

describe('extractMsgFields', () => {
  it('extracts sender/to/subject/body from unicode MAPI streams', () => {
    const streams = new Map<string, Uint8Array>([
      ['__substg1.0_0037001F', u16('季度销售汇报 Q3')],
      ['__substg1.0_0C1A001F', u16('张三 (Sales)')],
      ['__substg1.0_0C1F001F', u16('zhangsan@example.com')],
      ['__substg1.0_0E04001F', u16('李四 <lisi@example.com>')],
      ['__substg1.0_1000001F', u16('本季度虾青素饮销量领先，共售出520件。')],
    ]);
    const result = extractMsgFields(streams, 10_000);
    expect(result.content).toContain('Subject: 季度销售汇报 Q3');
    expect(result.content).toContain('From: 张三 (Sales) <zhangsan@example.com>');
    expect(result.content).toContain('To: 李四 <lisi@example.com>');
    expect(result.content).toContain('本季度虾青素饮销量领先，共售出520件。');
    expect(result.truncated).toBe(false);
  });

  it('prefers unicode(001F) over ascii(001E) for the same tag', () => {
    const ascii = new TextEncoder().encode('ascii subject');
    const streams = new Map<string, Uint8Array>([
      ['__substg1.0_0037001E', ascii],
      ['__substg1.0_0037001F', u16('unicode subject')],
    ]);
    const result = extractMsgFields(streams, 10_000);
    expect(result.content).toContain('Subject: unicode subject');
    expect(result.content).not.toContain('ascii subject');
  });

  it('falls back to conversation topic when subject is absent', () => {
    const streams = new Map<string, Uint8Array>([
      ['__substg1.0_0070001F', u16('主题回退话题')],
      ['__substg1.0_1000001F', u16('正文')],
    ]);
    expect(extractMsgFields(streams, 10_000).content).toContain('Subject: 主题回退话题');
  });

  it('warns when there is no body', () => {
    const streams = new Map<string, Uint8Array>([['__substg1.0_0037001F', u16('只有主题')]]);
    const result = extractMsgFields(streams, 10_000);
    expect(result.warnings.some(w => w.code === 'attachment.email_no_body')).toBe(true);
  });
});

describe('parseMsgDate', () => {
  it('reads delivery time (0E06 PT_SYSTIME) from __properties', () => {
    const props = new Uint8Array(48);
    const dv = new DataView(props.buffer);
    dv.setUint16(32, 0x0040, true); // type PT_SYSTIME
    dv.setUint16(34, 0x0e06, true); // id MessageDeliveryTime
    const filetime = (BigInt(Date.UTC(2026, 6, 9, 10, 0, 0)) + 11644473600000n) * 10000n;
    dv.setBigUint64(40, filetime, true);
    expect(parseMsgDate(props)).toBe('2026-07-09T10:00:00.000Z');
  });

  it('returns empty for missing/short properties', () => {
    expect(parseMsgDate(undefined)).toBe('');
    expect(parseMsgDate(new Uint8Array(10))).toBe('');
  });
});
