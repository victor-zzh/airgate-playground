// GFM 表格解析：与渲染层解耦的纯函数，供 MessageRendering 使用并单独测试。
// 只接管"确定是表格"的行块；解析失败时调用方回退为普通段落，绝不丢内容。

export type TableAlign = 'left' | 'center' | 'right' | null;

export interface ParsedMarkdownTable {
  header: string[];
  align: TableAlign[];
  rows: string[][];
}

// 是否可能是表格行（以 | 开头，或含未转义的 |）。宽松判断，最终以 parseMarkdownTable 校验为准。
export function isTableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('|')) return true;
  // 形如 "a | b | c" 的无边框表格行：需含分隔且不是代码/引用等其他块（由调用方保证顺序）
  return false;
}

// GFM 分隔单元格：1+ 连字符，两侧可带对齐冒号（:-: / :-- / --:）
const SEPARATOR_CELL_RE = /^:?-+:?$/;

function splitTableRow(line: string): string[] {
  let text = line.trim();
  if (text.startsWith('|')) text = text.slice(1);
  if (text.endsWith('|')) text = text.slice(0, -1);

  const cells: string[] = [];
  let current = '';
  let escaped = false;
  for (const ch of text) {
    if (escaped) {
      // \| 是单元格内的字面竖线；其余转义序列原样保留交给行内渲染
      current += ch === '|' ? '|' : `\\${ch}`;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '|') {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (escaped) current += '\\';
  cells.push(current.trim());
  return cells;
}

function parseSeparatorRow(line: string): TableAlign[] | null {
  const cells = splitTableRow(line);
  if (!cells.length) return null;
  const align: TableAlign[] = [];
  for (const cell of cells) {
    if (!SEPARATOR_CELL_RE.test(cell)) return null;
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) align.push('center');
    else if (right) align.push('right');
    else if (left) align.push('left');
    else align.push(null);
  }
  return align;
}

// 解析一个连续的表格行块。要求：首行为表头、第二行为分隔行（|---|:--:|），
// 其余为数据行；列数不齐时数据行截断/补空到表头列数。不合法返回 null。
export function parseMarkdownTable(lines: string[]): ParsedMarkdownTable | null {
  if (lines.length < 2) return null;
  const align = parseSeparatorRow(lines[1]);
  if (!align) return null;
  const header = splitTableRow(lines[0]);
  if (header.length < 2 || header.length !== align.length) return null;

  const rows = lines.slice(2).map(line => {
    const cells = splitTableRow(line);
    if (cells.length > header.length) return cells.slice(0, header.length);
    while (cells.length < header.length) cells.push('');
    return cells;
  });
  return { header, align, rows };
}
