import { CHARSET_FALLBACK_REPLACEMENT_RATIO } from './limits';
import type { AttachmentIssue, ExtractedText } from './types';

// 统一截断：附加明确的截断标注，让模型知道内容不完整。
export function truncateExtractedText(content: string, maxChars: number): { content: string; truncated: boolean } {
  if (content.length <= maxChars) return { content, truncated: false };
  const kept = content.slice(0, Math.max(0, maxChars));
  return {
    content: `${kept}\n\n[内容已截断：原文 ${content.length} 字符，仅保留前 ${kept.length} 字符]`,
    truncated: true,
  };
}

function replacementRatio(text: string): number {
  if (!text.length) return 0;
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 0xfffd) count++;
  }
  return count / text.length;
}

// UTF-8 解码；乱码比例过高时回退 GBK（中文业务文件常见编码）。
export function decodeTextBuffer(buffer: ArrayBuffer): { text: string; charset: string } {
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  if (replacementRatio(utf8) <= CHARSET_FALLBACK_REPLACEMENT_RATIO) {
    return { text: utf8, charset: 'utf-8' };
  }
  try {
    const gbk = new TextDecoder('gbk').decode(buffer);
    if (replacementRatio(gbk) < replacementRatio(utf8)) {
      return { text: gbk, charset: 'gbk' };
    }
  } catch {
    // TextDecoder 不支持 gbk 时维持 utf-8 结果
  }
  return { text: utf8, charset: 'utf-8' };
}

export function extractPlainText(buffer: ArrayBuffer, maxChars: number): ExtractedText {
  const warnings: AttachmentIssue[] = [];
  const { text, charset } = decodeTextBuffer(buffer);
  if (charset !== 'utf-8') {
    warnings.push({ code: 'attachment.charset_fallback', params: { charset } });
  }
  const normalized = text.replace(/\r\n?/g, '\n').replaceAll(String.fromCharCode(0), '');
  const { content, truncated } = truncateExtractedText(normalized, maxChars);
  if (truncated) warnings.push({ code: 'attachment.truncated' });
  return { content, truncated, warnings };
}
