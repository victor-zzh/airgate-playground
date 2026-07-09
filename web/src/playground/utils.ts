import type { ChatMessageContent, ModelInfo } from './types';
import type { BlobUrlRegistry, PendingFile, PendingImage, PreviewImage } from './types';
import {
  ACTIVE_CONVERSATION_STORAGE_KEY,
  BASE64_DATA_URL_RE,
  DEFAULT_MODEL_ID,
  FILE_BLOCK_RE,
  IMAGE_MARKDOWN_ITEM_RE,
  IMAGE_MARKDOWN_RE,
  SELECTED_MODEL_STORAGE_KEY,
} from './constants';

export function dataUrlToBlob(dataUrl: string): Blob | null {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx < 0) return null;
  const meta = dataUrl.slice(5, commaIdx);
  const mimeMatch = /^([^;]+)/.exec(meta);
  const mime = mimeMatch?.[1] || 'application/octet-stream';
  const b64 = dataUrl.slice(commaIdx + 1);
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

export function replaceBase64WithBlobUrls(content: string, registry: BlobUrlRegistry): string {
  if (!content || !content.includes('data:image/')) return content;
  return content.replace(BASE64_DATA_URL_RE, (dataUrl) => {
    const blob = dataUrlToBlob(dataUrl);
    if (!blob) return dataUrl;
    const url = URL.createObjectURL(blob);
    registry.set(url, dataUrl);
    return url;
  });
}

export function replaceBlobUrlsWithBase64(content: string, registry: BlobUrlRegistry): string {
  if (!content || !content.includes('blob:')) return content;
  return content.replace(/blob:[^\s)"']+/g, (url) => registry.get(url) || url);
}

export function revokeBlobRegistry(registry: BlobUrlRegistry) {
  registry.forEach((_, url) => URL.revokeObjectURL(url));
  registry.clear();
}

export function escapeMarkdownAlt(text: string) {
  return text.replace(/[\]\\]/g, '');
}

export function messageContentWithAttachments(text: string, images: PendingImage[], files: PendingFile[]) {
  const body = text.trim();
  const imageMarkdown = images.map(image => `![${escapeMarkdownAlt(image.name)}](${image.url})`).join('\n');
  const fileText = files.map(file => {
    const truncatedAttr = file.truncated ? ' truncated="true"' : '';
    // 内容里的字面 </file> 会提前终止 FILE_BLOCK_RE 的非贪婪匹配，转义防串块
    const safeContent = file.content.replace(/<\/file>/gi, '<\\/file>');
    return `<file name="${escapeFileAttribute(file.name)}" type="${escapeFileAttribute(file.type || 'text/plain')}" size="${file.size}"${truncatedAttr}>\n${safeContent}\n</file>`;
  }).join('\n\n');
  return [body, fileText, imageMarkdown].filter(Boolean).join('\n\n');
}

export interface ParsedFileBlock {
  name: string;
  type: string;
  size: number;
  truncated: boolean;
  content: string;
}

// 把消息里的 <file> 块拆出来（渲染层折叠成 chip 用）。
export function splitFileBlocks(content: string): Array<{ kind: 'text'; text: string } | { kind: 'file'; block: ParsedFileBlock }> {
  const segments: Array<{ kind: 'text'; text: string } | { kind: 'file'; block: ParsedFileBlock }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  FILE_BLOCK_RE.lastIndex = 0;

  while ((match = FILE_BLOCK_RE.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index).trim();
    if (before) segments.push({ kind: 'text', text: before });
    segments.push({
      kind: 'file',
      block: {
        name: unescapeFileAttribute(match[1]),
        type: unescapeFileAttribute(match[2]),
        size: Number(match[3]) || 0,
        truncated: Boolean(match[4]),
        content: match[5],
      },
    });
    lastIndex = match.index + match[0].length;
  }

  const tail = content.slice(lastIndex).trim();
  if (tail) segments.push({ kind: 'text', text: tail });
  return segments;
}

export function stripFileBlocks(content: string) {
  FILE_BLOCK_RE.lastIndex = 0;
  return content.replace(FILE_BLOCK_RE, (_m, name: string) => `[文件: ${unescapeFileAttribute(name)}]`);
}

function escapeFileAttribute(text: string) {
  return text.replace(/[&"]/g, (ch) => (ch === '&' ? '&amp;' : '&quot;'));
}

function unescapeFileAttribute(text: string) {
  return text.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

export function formatByteSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 100 * 1024 ? 1 : 0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function generatedImages(content: string): PreviewImage[] {
  const images: PreviewImage[] = [];
  let match: RegExpExecArray | null;
  IMAGE_MARKDOWN_ITEM_RE.lastIndex = 0;

  while ((match = IMAGE_MARKDOWN_ITEM_RE.exec(content)) !== null) {
    images.push({ alt: match[1], url: match[2] });
  }

  IMAGE_MARKDOWN_ITEM_RE.lastIndex = 0;
  return images;
}

export function stripImageMarkdown(content: string) {
  return content.replace(IMAGE_MARKDOWN_RE, '[Image]').trim() || '[Image]';
}

export function copyableMessageText(content: string) {
  return content.replace(IMAGE_MARKDOWN_RE, '[Image]').trim() || '[Image]';
}

export function hasCopyableMessageText(content: string) {
  return content.replace(IMAGE_MARKDOWN_RE, '').trim().length > 0;
}

export function titleFromMessageContent(content: string) {
  const title = stripFileBlocks(content).replace(IMAGE_MARKDOWN_RE, '[Image]').trim() || '[Image]';
  return title.slice(0, 30) + (title.length > 30 ? '...' : '');
}

export function toChatMessageContent(role: string, content: string): ChatMessageContent {
  if (role !== 'user') return stripImageMarkdown(content);

  const parts: Exclude<ChatMessageContent, string> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  IMAGE_MARKDOWN_RE.lastIndex = 0;

  while ((match = IMAGE_MARKDOWN_RE.exec(content)) !== null) {
    const text = content.slice(lastIndex, match.index).trim();
    if (text) parts.push({ type: 'text', text });
    parts.push({ type: 'image_url', image_url: { url: match[1] } });
    lastIndex = match.index + match[0].length;
  }

  const tail = content.slice(lastIndex).trim();
  if (tail) parts.push({ type: 'text', text: tail });

  return parts.length ? parts : content;
}

export function supportsReasoning(model?: ModelInfo) {
  if (!model) return false;
  if (model.capabilities?.includes('reasoning') || model.capabilities?.includes('thinking')) return true;
  if (!model.capabilities?.length) return true;
  return false;
}

export function modelOptionValue(model: ModelInfo) {
  return `${encodeURIComponent(model.platform || '')}:${encodeURIComponent(model.id)}`;
}

export function normalizeModelName(value?: string) {
  return (value || '').toLowerCase().replace(/[-_\s]/g, '');
}

export function defaultModelOptionValue(models: ModelInfo[]) {
  const target = normalizeModelName(DEFAULT_MODEL_ID);
  const preferred = models.find(model => normalizeModelName(model.id) === target || normalizeModelName(model.name) === target);
  return preferred ? modelOptionValue(preferred) : (models[0] ? modelOptionValue(models[0]) : '');
}

export function readLocalStorageValue(key: string) {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

export function writeLocalStorageValue(key: string, value: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private mode or locked-down browsers.
  }
}

export function getStoredActiveConversationId() {
  const raw = readLocalStorageValue(ACTIVE_CONVERSATION_STORAGE_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function getStoredSelectedModel() {
  return readLocalStorageValue(SELECTED_MODEL_STORAGE_KEY);
}

export function isSafeLinkUrl(url: string) {
  return /^(https?:|mailto:|#)/i.test(url);
}

export function isSafeImageUrl(url: string) {
  return /^(data:image\/(?:png|jpeg|jpg|webp|gif);base64,|https?:|blob:|\/assets-runtime\/|\/api\/v1\/ext-user\/airgate-playground\/assets\/)/i.test(url);
}

export async function copyText(text: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('copy failed');
}
