// 轻量 MIME 解析，供 .eml / .mht(.mhtml) 抽取使用。
// 约定：原始文件按 latin1 解码成"字节保真"字符串（码点 0-255 与字节一一对应），
// 各 part 再按自身 Content-Transfer-Encoding + charset 还原为真正的文本。

export interface MimePart {
  headers: Map<string, string>;
  body: string; // latin1 原始字节串
}

export function bytesToLatin1(buffer: ArrayBuffer): string {
  return new TextDecoder('latin1').decode(buffer);
}

function latin1ToBytes(raw: string): Uint8Array {
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i) & 0xff;
  return bytes;
}

// 头块解析：unfold 续行，键小写；重复头以换行合并。
export function parseHeaderBlock(block: string): Map<string, string> {
  const headers = new Map<string, string>();
  const unfolded = block.replace(/\r?\n[ \t]+/g, ' ');
  for (const line of unfolded.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    headers.set(key, headers.has(key) ? `${headers.get(key)}\n${value}` : value);
  }
  return headers;
}

export function parseMimeMessage(raw: string): MimePart {
  const match = /\r?\n\r?\n/.exec(raw);
  if (!match) return { headers: parseHeaderBlock(raw), body: '' };
  return {
    headers: parseHeaderBlock(raw.slice(0, match.index)),
    body: raw.slice(match.index + match[0].length),
  };
}

// Content-Type / Content-Disposition 参数解析。
export function parseHeaderParams(value: string): { value: string; params: Record<string, string> } {
  const segments = value.split(';');
  const params: Record<string, string> = {};
  for (const segment of segments.slice(1)) {
    const idx = segment.indexOf('=');
    if (idx <= 0) continue;
    const key = segment.slice(0, idx).trim().toLowerCase();
    let val = segment.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
      val = val.slice(1, -1);
    }
    if (key) params[key] = val;
  }
  return { value: segments[0].trim().toLowerCase(), params };
}

export function decodeQuotedPrintableToBytes(input: string): Uint8Array {
  const collapsed = input.replace(/=\r?\n/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < collapsed.length; i++) {
    const ch = collapsed[i];
    if (ch === '=') {
      const hex = collapsed.slice(i + 1, i + 3);
      if (/^[0-9a-fA-F]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(ch.charCodeAt(0) & 0xff);
  }
  return new Uint8Array(bytes);
}

export function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  try {
    const binary = atob(cleaned);
    return latin1ToBytes(binary);
  } catch {
    return new Uint8Array(0);
  }
}

export function decodeCharsetBytes(bytes: Uint8Array, charset?: string): string {
  const normalized = (charset || '').trim().toLowerCase();
  if (!normalized) {
    // 未声明 charset 的 part（中文邮件常见）：走 UTF-8 + GBK 乱码回退启发
    return decodeUnknownCharsetBytes(bytes);
  }
  try {
    return new TextDecoder(normalized).decode(bytes);
  } catch {
    return decodeUnknownCharsetBytes(bytes);
  }
}

function decodeUnknownCharsetBytes(bytes: Uint8Array): string {
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  if (!utf8.includes('�')) return utf8;
  try {
    const gbk = new TextDecoder('gbk').decode(bytes);
    const count = (text: string) => text.split('�').length;
    if (count(gbk) < count(utf8)) return gbk;
  } catch {
    // TextDecoder 不支持 gbk 时维持 utf-8 结果
  }
  return utf8;
}

// RFC 2047 encoded-word：=?charset?B|Q?data?=
// 相邻 encoded-word 之间的空白按规范先去掉再解码（长中文主题常被拆成多个 word）。
export function decodeEncodedWords(value: string): string {
  const joined = value.replace(/(\?=)\s+(=\?)/g, '$1$2');
  return joined.replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (_m, charset: string, enc: string, data: string) => {
    const bytes = enc.toLowerCase() === 'b'
      ? base64ToBytes(data)
      : decodeQuotedPrintableToBytes(data.replace(/_/g, ' '));
    return decodeCharsetBytes(bytes, charset);
  });
}

// 解出 part 的真实文本（按 CTE + charset）。
export function partBodyText(part: MimePart): string {
  const cte = (part.headers.get('content-transfer-encoding') || '').trim().toLowerCase();
  const { params } = parseHeaderParams(part.headers.get('content-type') || '');
  const charset = params['charset'];
  if (cte === 'base64') {
    return decodeCharsetBytes(base64ToBytes(part.body), charset);
  }
  if (cte === 'quoted-printable') {
    return decodeCharsetBytes(decodeQuotedPrintableToBytes(part.body), charset);
  }
  return decodeCharsetBytes(latin1ToBytes(part.body), charset);
}

export function splitMultipart(body: string, boundary: string): MimePart[] {
  const marker = `--${boundary}`;
  const segments = body.split(marker);
  const parts: MimePart[] = [];
  // 第一段是 preamble，最后可能是 "--\r\n" epilogue
  for (const segment of segments.slice(1)) {
    if (segment.startsWith('--')) break;
    const trimmed = segment.replace(/^\r?\n/, '');
    if (!trimmed.trim()) continue;
    parts.push(parseMimeMessage(trimmed));
  }
  return parts;
}

// 递归展开 multipart，返回所有叶子 part。
export function flattenParts(part: MimePart, depth = 0): MimePart[] {
  if (depth > 8) return [part];
  const { value: contentType, params } = parseHeaderParams(part.headers.get('content-type') || '');
  if (contentType.startsWith('multipart/') && params['boundary']) {
    const children = splitMultipart(part.body, params['boundary']);
    if (!children.length) return [part];
    return children.flatMap(child => flattenParts(child, depth + 1));
  }
  return [part];
}

export function partContentType(part: MimePart): string {
  return parseHeaderParams(part.headers.get('content-type') || '').value;
}

export function partIsAttachment(part: MimePart): boolean {
  const disposition = parseHeaderParams(part.headers.get('content-disposition') || '');
  return disposition.value === 'attachment';
}

export function partFilename(part: MimePart): string {
  const disposition = parseHeaderParams(part.headers.get('content-disposition') || '');
  const contentType = parseHeaderParams(part.headers.get('content-type') || '');
  const name = disposition.params['filename'] || contentType.params['name'] || '';
  return decodeEncodedWords(name);
}
