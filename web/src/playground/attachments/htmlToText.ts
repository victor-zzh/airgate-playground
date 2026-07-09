// HTML → 纯文本。用 DOMParser 解析（parseFromString 不执行脚本），
// 去除 script/style 等非内容节点与 base64 内联资源，按块级元素换行。

const SKIP_TAGS = new Set([
  'script', 'style', 'noscript', 'template', 'iframe', 'object', 'embed',
  'svg', 'canvas', 'audio', 'video', 'head', 'link', 'meta',
]);

const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'br', 'dd', 'div', 'dl', 'dt',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4',
  'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section',
  'table', 'tr', 'ul',
]);

function collectText(node: Node, out: string[]) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (text.trim()) {
      out.push(text.replace(/\s+/g, ' '));
    } else if (text) {
      // 行内元素之间的纯空白节点是分词分隔符（<span>Total:</span> <span>42</span>），不能丢
      out.push(' ');
    }
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return;
  // 跳过隐藏节点（保存网页常见大量 display:none 的模板内容）
  const styleAttr = (el.getAttribute('style') || '').replace(/\s/g, '').toLowerCase();
  if (el.getAttribute('hidden') != null || styleAttr.includes('display:none') || styleAttr.includes('visibility:hidden')) {
    return;
  }
  const isBlock = BLOCK_TAGS.has(tag);
  if (isBlock) out.push('\n');
  if (tag === 'td' || tag === 'th') out.push(' | ');
  for (const child of Array.from(el.childNodes)) {
    collectText(child, out);
  }
  if (isBlock) out.push('\n');
}

export function htmlToText(html: string): { title: string; text: string } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const title = (doc.title || '').trim();
  const out: string[] = [];
  if (doc.body) collectText(doc.body, out);
  const text = out
    .join('')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  return { title, text };
}
