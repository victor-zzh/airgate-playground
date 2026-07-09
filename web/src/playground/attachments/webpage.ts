import { htmlToText } from './htmlToText';
import {
  bytesToLatin1,
  flattenParts,
  parseMimeMessage,
  partBodyText,
  partContentType,
} from './mime';
import { decodeTextBuffer, truncateExtractedText } from './textExtract';
import type { AttachmentIssue, ExtractedText } from './types';

function finalize(title: string, text: string, maxChars: number, warnings: AttachmentIssue[]): ExtractedText {
  const combined = [title ? `Title: ${title}` : '', text].filter(Boolean).join('\n\n');
  const { content, truncated } = truncateExtractedText(combined, maxChars);
  if (truncated) warnings.push({ code: 'attachment.truncated' });
  return { content, truncated, warnings };
}

// .html/.htm 保存文件 → 标题 + 正文纯文本。
export function extractHtmlFile(buffer: ArrayBuffer, maxChars: number): ExtractedText {
  const warnings: AttachmentIssue[] = [];
  const { text: html, charset } = decodeTextBuffer(buffer);
  if (charset !== 'utf-8') warnings.push({ code: 'attachment.charset_fallback', params: { charset } });
  const { title, text } = htmlToText(html);
  if (!text) warnings.push({ code: 'attachment.webpage_empty' });
  return finalize(title, text, maxChars, warnings);
}

// .mht/.mhtml（multipart/related）→ 取首个 text/html part 转纯文本。
export function extractMhtml(buffer: ArrayBuffer, maxChars: number): ExtractedText {
  const warnings: AttachmentIssue[] = [];
  const message = parseMimeMessage(bytesToLatin1(buffer));
  const parts = flattenParts(message);
  const htmlPart = parts.find(part => partContentType(part) === 'text/html');
  if (!htmlPart) {
    warnings.push({ code: 'attachment.webpage_empty' });
    return finalize('', '', maxChars, warnings);
  }
  const { title, text } = htmlToText(partBodyText(htmlPart));
  if (!text) warnings.push({ code: 'attachment.webpage_empty' });
  return finalize(title, text, maxChars, warnings);
}
