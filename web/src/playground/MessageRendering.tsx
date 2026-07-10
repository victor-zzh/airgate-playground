import { Children, Suspense, cloneElement, isValidElement, lazy, useState, type ReactNode } from 'react';
import type { MessageContentOptions } from './types';
import { styles } from './styles';
import { copyText, formatByteSize, isSafeImageUrl, isSafeLinkUrl, splitFileBlocks, type ParsedFileBlock } from './utils';
import { IMAGE_MARKDOWN_ITEM_RE } from './constants';
import { isTableLine, parseMarkdownTable, type ParsedMarkdownTable, type TableAlign } from './markdownTable';
import { buildListTree, parseListLine, type ListItemToken, type ListNode } from './markdownList';

const MathRenderer = lazy(() => import('../MathRenderer'));

function pushTextWithBreaks(nodes: ReactNode[], text: string, keyPrefix: string) {
  const parts = text.split('\n');
  parts.forEach((part, index) => {
    if (index > 0) {
      nodes.push(<br key={`${keyPrefix}-br-${index}`} />);
    }
    if (part) {
      nodes.push(part);
    }
  });
}

export function GeneratedImageFrame({ url, alt, options, imageIndex }: {
  url: string; alt: string; options: MessageContentOptions; imageIndex: number;
}) {
  const [dimensions, setDimensions] = useState('');
  const imageNode = (
    <img
      src={url}
      alt={alt}
      style={styles.generatedImage}
      loading="lazy"
      onLoad={e => {
        const img = e.currentTarget;
        if (img.naturalWidth && img.naturalHeight) {
          setDimensions(`${img.naturalWidth}×${img.naturalHeight}`);
        }
      }}
    />
  );
  const previewTitle = options.imagePreviewTitle || 'Preview image';
  const previewableImage = options.onImagePreview ? (
    <button
      type="button"
      style={styles.generatedImagePreviewBtn}
      title={previewTitle}
      aria-label={previewTitle}
      onClick={() => options.onImagePreview?.(url, alt, imageIndex)}
    >
      {imageNode}
    </button>
  ) : imageNode;

  return (
    <span style={{ ...styles.generatedImageFrame, ...(options.isMobile ? styles.generatedImageFrameMobile : null) }}>
      {previewableImage}
      {dimensions && <span style={styles.generatedImageDimensions}>{dimensions}</span>}
    </span>
  );
}

function renderGeneratedImage(key: string, url: string, alt: string, options: MessageContentOptions) {
  const imageIndex = options.takeImageIndex?.() ?? -1;
  return <GeneratedImageFrame key={key} url={url} alt={alt} options={options} imageIndex={imageIndex} />;
}

export function renderInlineMarkdown(text: string, keyPrefix: string, options: MessageContentOptions = {}) {
  const nodes: ReactNode[] = [];
  const inlineRe = /(`([^`]+)`|\\\(([\s\S]*?)\\\)|(?<!\\)\$(?!\s)([^\n$]*?\S)(?<!\\)\$|!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|~~([^~\n]+)~~)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      pushTextWithBreaks(nodes, text.slice(lastIndex, match.index), `${keyPrefix}-text-${lastIndex}`);
    }

    const key = `${keyPrefix}-${match.index}`;
    const inlineCode = match[2];
    const parenMath = match[3];
    const dollarMath = match[4];
    const imageAlt = match[5];
    const imageUrl = match[6];
    const linkText = match[7];
    const linkUrl = match[8];
    const boldText = match[9] || match[10];
    const italicText = match[11] || match[12];
    const strikeText = match[13];

    if (inlineCode) {
      nodes.push(<code key={key} style={styles.markdownInlineCode}>{inlineCode}</code>);
    } else if (parenMath || dollarMath) {
      nodes.push(renderMath(parenMath || dollarMath, key, false));
    } else if (imageUrl && isSafeImageUrl(imageUrl)) {
      nodes.push(renderGeneratedImage(key, imageUrl, imageAlt || options.generatedImageAlt || 'Generated image', options));
    } else if (linkUrl && isSafeLinkUrl(linkUrl)) {
      nodes.push(
        <a key={key} href={linkUrl} style={styles.markdownLink} target="_blank" rel="noreferrer">
          {renderInlineMarkdown(linkText, `${key}-link`, options)}
        </a>,
      );
    } else if (boldText) {
      nodes.push(<strong key={key}>{renderInlineMarkdown(boldText, `${key}-bold`, options)}</strong>);
    } else if (italicText) {
      nodes.push(<em key={key}>{renderInlineMarkdown(italicText, `${key}-em`, options)}</em>);
    } else if (strikeText) {
      nodes.push(<del key={key} style={styles.markdownStrike}>{renderInlineMarkdown(strikeText, `${key}-del`, options)}</del>);
    } else {
      nodes.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    pushTextWithBreaks(nodes, text.slice(lastIndex), `${keyPrefix}-text-${lastIndex}`);
  }

  return nodes.length > 0 ? nodes : text;
}

function renderMath(tex: string, key: string, displayMode: boolean) {
  const Tag = displayMode ? 'div' : 'span';
  const style = displayMode ? styles.markdownBlockMath : styles.markdownInlineMath;
  const fallback = <Tag style={style}>{tex}</Tag>;
  return (
    <Suspense key={key} fallback={fallback}>
      <MathRenderer displayMode={displayMode} style={style} tex={tex} />
    </Suspense>
  );
}

// 代码块：语言标签 + 一键复制。样式由 shell 承载（markdownCodeBlock 只管 pre 本体）。
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={styles.markdownCodeShell}>
      <div style={styles.markdownCodeHeader}>
        <span style={styles.markdownCodeLang}>{language || 'code'}</span>
        <button
          type="button"
          style={{ ...styles.markdownCodeCopyBtn, ...(copied ? styles.markdownCodeCopyBtnDone : null) }}
          aria-label="复制代码"
          onClick={() => {
            void copyText(code)
              .then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1400);
              })
              .catch(() => {});
          }}
        >
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre style={styles.markdownCodeBlock}><code>{code}</code></pre>
    </div>
  );
}

// GFM 表格：外层横向滚动容器兜住宽表，表头着色、末行不画底线（避免与容器边框叠加）。
function renderTable(table: ParsedMarkdownTable, key: string, options: MessageContentOptions) {
  const alignStyle = (align: TableAlign) => (align ? { textAlign: align } : undefined);
  return (
    <div key={key} style={styles.markdownTableWrap}>
      <table style={styles.markdownTable}>
        <thead>
          <tr>
            {table.header.map((cell, col) => (
              <th key={col} style={{ ...styles.markdownTableHeadCell, ...alignStyle(table.align[col]) }}>
                {renderInlineMarkdown(cell, `${key}-h${col}`, options)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r} style={r % 2 === 1 ? styles.markdownTableRowAlt : undefined}>
              {row.map((cell, c) => (
                <td
                  key={c}
                  style={{
                    ...styles.markdownTableCell,
                    ...(r === table.rows.length - 1 ? styles.markdownTableCellLastRow : null),
                    ...alignStyle(table.align[c]),
                  }}
                >
                  {renderInlineMarkdown(cell, `${key}-r${r}c${c}`, options)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 嵌套列表：按 buildListTree 组装的层级递归渲染，任务项以勾选框替代圆点。
function renderListNodes(items: ListNode[], key: string, options: MessageContentOptions, nested = false): ReactNode {
  const ListTag = items[0].ordered ? 'ol' : 'ul';
  return (
    <ListTag key={key} style={nested ? styles.markdownNestedList : styles.markdownList}>
      {items.map((item, index) => (
        <li
          key={`${key}-${index}`}
          style={{ ...styles.markdownListItem, ...(item.checked !== null ? styles.markdownTaskItem : null) }}
        >
          {item.checked !== null && (
            <span aria-hidden="true" style={{ ...styles.markdownTaskBox, ...(item.checked ? styles.markdownTaskBoxChecked : null) }}>
              {item.checked ? '✓' : ''}
            </span>
          )}
          {renderInlineMarkdown(item.text, `${key}-${index}`, options)}
          {item.children.length > 0 && renderListNodes(item.children, `${key}-${index}-sub`, options, true)}
        </li>
      ))}
    </ListTag>
  );
}

function renderHeading(level: number, text: string, key: string, options: MessageContentOptions = {}) {
  const content = renderInlineMarkdown(text, `${key}-inline`, options);
  if (level === 1) return <h1 key={key} style={styles.markdownH1}>{content}</h1>;
  if (level === 2) return <h2 key={key} style={styles.markdownH2}>{content}</h2>;
  if (level === 3) return <h3 key={key} style={styles.markdownH3}>{content}</h3>;
  return <h4 key={key} style={styles.markdownH4}>{content}</h4>;
}

export function renderImageGroup(text: string, key: string, options: MessageContentOptions = {}) {
  const images = parseImageGroupImages(text);
  if (!images) return null;

  return renderImageGallery(images, key, options);
}

export function parseImageGroupImages(text: string) {
  const images: Array<{ alt: string; url: string }> = [];
  let match: RegExpExecArray | null;
  IMAGE_MARKDOWN_ITEM_RE.lastIndex = 0;

  while ((match = IMAGE_MARKDOWN_ITEM_RE.exec(text)) !== null) {
    images.push({ alt: match[1], url: match[2] });
  }

  const remainder = text.replace(IMAGE_MARKDOWN_ITEM_RE, '').trim();
  if (!images.length || remainder) return null;

  return images;
}

export function renderImageGallery(images: Array<{ alt: string; url: string }>, key: string, options: MessageContentOptions = {}) {
  return (
    <div key={key} style={{ ...styles.imageGroup, ...(options.isMobile ? styles.imageGroupMobile : null) }}>
      {images.map((image, index) => renderGeneratedImage(`${key}-${index}`, image.url, image.alt || options.generatedImageAlt || 'Generated image', options))}
    </div>
  );
}

const INLINE_ACTION_TARGETS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'li']);

function appendTrailingInlineActionToNode(node: ReactNode, action: ReactNode): ReactNode | null {
  if (!isValidElement<{ children?: ReactNode }>(node) || typeof node.type !== 'string') return null;

  if (INLINE_ACTION_TARGETS.has(node.type)) {
    return cloneElement(node, undefined, ...Children.toArray(node.props.children), action);
  }

  if (node.type === 'ol' || node.type === 'ul') {
    const children: ReactNode[] = Children.toArray(node.props.children);
    for (let index = children.length - 1; index >= 0; index--) {
      const childWithAction = appendTrailingInlineActionToNode(children[index], action);
      if (childWithAction) {
        const nextChildren: ReactNode[] = [...children];
        nextChildren[index] = childWithAction;
        return cloneElement(node, undefined, ...nextChildren);
      }
    }
  }

  return null;
}

export function appendTrailingInlineAction(nodes: ReactNode[], action?: ReactNode) {
  if (!action) return nodes;

  for (let index = nodes.length - 1; index >= 0; index--) {
    const nodeWithAction = appendTrailingInlineActionToNode(nodes[index], action);
    if (nodeWithAction) {
      const nextNodes = [...nodes];
      nextNodes[index] = nodeWithAction;
      return nextNodes;
    }
  }

  return nodes;
}

const fileBlockChipStyles = {
  details: {
    margin: '4px 0',
    border: '1px solid rgba(128, 128, 128, 0.28)',
    borderRadius: 8,
    padding: '4px 8px',
    background: 'rgba(128, 128, 128, 0.08)',
    fontSize: 13,
  },
  summary: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    listStyle: 'none' as const,
    userSelect: 'none' as const,
  },
  name: {
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: 260,
  },
  meta: { opacity: 0.65, fontSize: 12, flexShrink: 0 },
  badge: {
    fontSize: 11,
    padding: '0 6px',
    borderRadius: 6,
    background: 'rgba(217, 119, 6, 0.16)',
    color: '#b45309',
    flexShrink: 0,
  },
  content: {
    marginTop: 6,
    maxHeight: 320,
    overflow: 'auto' as const,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    fontSize: 12,
    lineHeight: 1.5,
    opacity: 0.9,
  },
};

// 消息里的 <file> 块折叠为 chip，展开时才渲染内容（200k 字符的抽取文本不能直出气泡）。
function FileBlockChip({ block }: { block: ParsedFileBlock }) {
  const [open, setOpen] = useState(false);
  const sizeLabel = formatByteSize(block.size);
  return (
    <details
      style={fileBlockChipStyles.details}
      onToggle={event => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary style={fileBlockChipStyles.summary}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
        <span style={fileBlockChipStyles.name} title={block.name}>{block.name}</span>
        {sizeLabel && <span style={fileBlockChipStyles.meta}>{sizeLabel}</span>}
        {block.truncated && <span style={fileBlockChipStyles.badge}>已截断</span>}
      </summary>
      {open && <div style={fileBlockChipStyles.content}>{block.content}</div>}
    </details>
  );
}

export function renderMessageContent(content: string, options: MessageContentOptions = {}) {
  if (options.parseFileBlocks && content.includes('<file name="')) {
    const segments = splitFileBlocks(content);
    if (segments.some(segment => segment.kind === 'file')) {
      // 图片预览索引须跨文本段连续（ChatView 用整条消息的 generatedImages 列表）
      let imageIndex = -1;
      const sharedOptions: MessageContentOptions = {
        ...options,
        takeImageIndex: () => {
          imageIndex += 1;
          return imageIndex;
        },
      };
      // trailingInlineAction（悬浮复制按钮）只挂在最后一个文本段，避免逐段重复。
      const lastTextIndex = segments.reduce((last, segment, index) => (segment.kind === 'text' ? index : last), -1);
      const nodes = segments.map((segment, index) => (
        segment.kind === 'file'
          ? <FileBlockChip key={`fileblock-${index}`} block={segment.block} />
          : (
            <div key={`filetext-${index}`}>
              {renderMarkdownContent(
                segment.text,
                index === lastTextIndex ? sharedOptions : { ...sharedOptions, trailingInlineAction: undefined },
              )}
            </div>
          )
      ));
      // 纯文件消息没有文本段可挂复制按钮，单独补一行
      if (lastTextIndex === -1 && options.trailingInlineAction) {
        nodes.push(<div key="fileblock-action">{options.trailingInlineAction}</div>);
      }
      return nodes;
    }
  }
  return renderMarkdownContent(content, options);
}

function renderMarkdownContent(content: string, options: MessageContentOptions = {}) {
  // 分段渲染（file 块拆分）时由上层传入共享计数器，保证图片索引跨段连续
  let imageIndex = -1;
  const renderOptions: MessageContentOptions = {
    ...options,
    takeImageIndex: options.takeImageIndex ?? (() => {
      imageIndex += 1;
      return imageIndex;
    }),
  };
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const nodes: ReactNode[] = [];
  let paragraph: string[] = [];
  let quote: string[] = [];
  let listItems: ListItemToken[] = [];
  let codeLines: string[] = [];
  let codeLang = '';
  let mathLines: string[] = [];
  let tableLines: string[] = [];
  let pendingImageGroup: Array<{ alt: string; url: string }> = [];
  let inCodeBlock = false;
  let inMathBlock: '$$' | '\\]' | null = null;
  let nodeIndex = 0;

  const nextKey = (type: string) => `${type}-${nodeIndex++}`;
  const flushPendingImageGroup = () => {
    if (!pendingImageGroup.length) return;
    nodes.push(renderImageGallery(pendingImageGroup, nextKey('images'), renderOptions));
    pendingImageGroup = [];
  };
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join('\n');
    const images = parseImageGroupImages(text);
    if (images) {
      pendingImageGroup.push(...images);
    } else {
      flushPendingImageGroup();
      const key = nextKey('p');
      nodes.push(<p key={key} style={styles.markdownParagraph}>{renderInlineMarkdown(text, key, renderOptions)}</p>);
    }
    paragraph = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    flushPendingImageGroup();
    const key = nextKey('quote');
    nodes.push(<blockquote key={key} style={styles.markdownBlockquote}>{renderInlineMarkdown(quote.join('\n'), key, renderOptions)}</blockquote>);
    quote = [];
  };
  const flushList = () => {
    if (!listItems.length) return;
    flushPendingImageGroup();
    nodes.push(renderListNodes(buildListTree(listItems), nextKey('list'), renderOptions));
    listItems = [];
  };
  const flushTable = () => {
    if (!tableLines.length) return;
    flushPendingImageGroup();
    const table = parseMarkdownTable(tableLines);
    if (table) {
      nodes.push(renderTable(table, nextKey('table'), renderOptions));
    } else {
      // 不是合法表格：按普通段落回退，内容一个字都不能丢
      paragraph.push(...tableLines);
      flushParagraph();
    }
    tableLines = [];
  };
  const flushBlocks = () => {
    flushParagraph();
    flushQuote();
    flushList();
  };
  const flushAllBlocks = () => {
    flushBlocks();
    flushPendingImageGroup();
  };
  const flushCodeBlock = () => {
    flushPendingImageGroup();
    nodes.push(<CodeBlock key={nextKey('code')} language={codeLang} code={codeLines.join('\n')} />);
    codeLines = [];
    codeLang = '';
  };
  const flushMathBlock = () => {
    flushPendingImageGroup();
    const key = nextKey('math');
    nodes.push(renderMath(mathLines.join('\n').trim(), key, true));
    mathLines = [];
  };

  for (const line of lines) {
    if (inMathBlock) {
      const closingIndex = inMathBlock === '$$' ? line.indexOf('$$') : line.indexOf('\\]');
      if (closingIndex >= 0) {
        const delimiterLength = inMathBlock.length;
        mathLines.push(line.slice(0, closingIndex));
        flushMathBlock();
        inMathBlock = null;
        const rest = line.slice(closingIndex + delimiterLength).trim();
        if (rest) paragraph.push(rest);
      } else {
        mathLines.push(line);
      }
      continue;
    }

    const fenceMatch = line.match(/^```(.*)$/);
    if (fenceMatch) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushTable();
        flushAllBlocks();
        inCodeBlock = true;
        codeLang = (fenceMatch[1] || '').trim().split(/\s+/)[0] || '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushTable();
      flushBlocks();
      continue;
    }

    // 表格行收集：连续 | 开头的行攒成块，遇到非表格行或空行时统一校验与渲染
    if (isTableLine(line)) {
      if (!tableLines.length) flushAllBlocks();
      tableLines.push(line);
      continue;
    }
    if (tableLines.length) flushTable();

    const trimmedLine = line.trim();
    const dollarBlockMatch = trimmedLine.match(/^\$\$([\s\S]*?)\$\$$/);
    const bracketBlockMatch = trimmedLine.match(/^\\\[([\s\S]*?)\\\]$/);
    if (dollarBlockMatch || bracketBlockMatch) {
      flushAllBlocks();
      nodes.push(renderMath((dollarBlockMatch?.[1] || bracketBlockMatch?.[1] || '').trim(), nextKey('math'), true));
      continue;
    }

    if (trimmedLine.startsWith('$$') || trimmedLine.startsWith('\\[')) {
      flushAllBlocks();
      const isDollarMath = trimmedLine.startsWith('$$');
      const openingDelimiter = isDollarMath ? '$$' : '\\[';
      const closingDelimiter = isDollarMath ? '$$' : '\\]';
      const afterOpening = trimmedLine.slice(openingDelimiter.length);
      const closingIndex = afterOpening.indexOf(closingDelimiter);
      if (closingIndex >= 0) {
        nodes.push(renderMath(afterOpening.slice(0, closingIndex).trim(), nextKey('math'), true));
      } else {
        mathLines.push(afterOpening);
        inMathBlock = closingDelimiter as '$$' | '\\]';
      }
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushAllBlocks();
      nodes.push(renderHeading(Math.min(headingMatch[1].length, 4), headingMatch[2].trim(), nextKey('heading'), renderOptions));
      continue;
    }

    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
      flushAllBlocks();
      nodes.push(<hr key={nextKey('hr')} style={styles.markdownDivider} />);
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1]);
      continue;
    }

    const listItem = parseListLine(line);
    if (listItem) {
      flushParagraph();
      flushQuote();
      // 顶层项切换有序/无序时另起一组；嵌套层级的混用交给列表树处理
      if (listItems.length && listItem.level === 0 && listItems[0].ordered !== listItem.ordered) flushList();
      listItems.push(listItem);
      continue;
    }

    flushQuote();
    flushList();
    paragraph.push(line);
  }

  if (inCodeBlock) flushCodeBlock();
  if (inMathBlock) flushMathBlock();
  flushTable();
  flushBlocks();
  flushPendingImageGroup();

  const renderedNodes = appendTrailingInlineAction(nodes, options.trailingInlineAction);
  return renderedNodes.length > 0 ? renderedNodes : content;
}
