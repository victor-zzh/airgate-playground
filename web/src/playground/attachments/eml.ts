import { htmlToText } from './htmlToText';
import {
  bytesToLatin1,
  decodeEncodedWords,
  flattenParts,
  parseMimeMessage,
  partBodyText,
  partContentType,
  partFilename,
  partIsAttachment,
  type MimePart,
} from './mime';
import { truncateExtractedText } from './textExtract';
import type { AttachmentIssue, ExtractedText } from './types';

function headerLine(part: MimePart, key: string, label: string): string {
  const value = part.headers.get(key);
  if (!value) return '';
  return `${label}: ${decodeEncodedWords(value).replace(/\n/g, ', ')}`;
}

function pickBodyPart(parts: MimePart[]): { part: MimePart; isHtml: boolean } | null {
  const inline = parts.filter(part => !partIsAttachment(part));
  // 无 Content-Type 头时按 RFC 默认 text/plain 处理
  const plain = inline.find(part => {
    const type = partContentType(part);
    return type === 'text/plain' || type === '';
  });
  if (plain) return { part: plain, isHtml: false };
  const html = inline.find(part => partContentType(part) === 'text/html');
  if (html) return { part: html, isHtml: true };
  return null;
}

// .eml → From/To/Cc/Subject/Date + 正文（优先 text/plain，否则 HTML 转纯文本）。
export function extractEml(buffer: ArrayBuffer, maxChars: number): ExtractedText {
  const warnings: AttachmentIssue[] = [];
  const message = parseMimeMessage(bytesToLatin1(buffer));
  const parts = flattenParts(message);

  const headerLines = [
    headerLine(message, 'from', 'From'),
    headerLine(message, 'to', 'To'),
    headerLine(message, 'cc', 'Cc'),
    headerLine(message, 'subject', 'Subject'),
    headerLine(message, 'date', 'Date'),
  ].filter(Boolean);

  const picked = pickBodyPart(parts);
  let bodyText = '';
  if (picked) {
    const raw = partBodyText(picked.part);
    bodyText = picked.isHtml ? htmlToText(raw).text : raw.replace(/\r\n?/g, '\n').trim();
  } else {
    warnings.push({ code: 'attachment.email_no_body' });
  }

  const attachmentNames = parts
    .filter(part => partIsAttachment(part))
    .map(part => partFilename(part) || '(unnamed)');
  const attachmentLines = attachmentNames.length
    ? [`Attachments: ${attachmentNames.join(', ')}（附件内容未包含，如需分析请单独上传）`]
    : [];

  const combined = [headerLines.join('\n'), bodyText, attachmentLines.join('\n')]
    .filter(Boolean)
    .join('\n\n');
  const { content, truncated } = truncateExtractedText(combined, maxChars);
  if (truncated) warnings.push({ code: 'attachment.truncated' });
  return { content, truncated, warnings };
}
