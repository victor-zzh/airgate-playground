import {
  MAX_CELL_CHARS,
  MAX_COLS_PER_SHEET,
  MAX_ROWS_PER_SHEET,
  MAX_SHEETS_PER_WORKBOOK,
} from './limits';
import { loadXlsxRuntime } from './vendor';
import { truncateExtractedText } from './textExtract';
import type { AttachmentIssue, ExtractedText } from './types';

export interface SheetRows {
  name: string;
  rows: unknown[][];
}

function cellText(value: unknown): string {
  if (value == null) return '';
  let text = String(value).replace(/\r\n?/g, '\n').replace(/\n/g, ' ').replace(/\|/g, '\\|').trim();
  if (text.length > MAX_CELL_CHARS) {
    text = `${text.slice(0, MAX_CELL_CHARS)}…`;
  }
  return text;
}

// 单个 sheet → Markdown 表格；超行/列时标注截断。
export function sheetRowsToMarkdown(sheet: SheetRows): string {
  const lines: string[] = [`## Sheet: ${sheet.name}`];
  const rows = sheet.rows;
  if (!rows.length) {
    lines.push('(空表)');
    return lines.join('\n');
  }

  const totalCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const colCount = Math.min(totalCols, MAX_COLS_PER_SHEET);
  const rowCount = Math.min(rows.length, MAX_ROWS_PER_SHEET);

  const renderRow = (row: unknown[]) => {
    const cells: string[] = [];
    for (let c = 0; c < colCount; c++) cells.push(cellText(row[c]));
    return `| ${cells.join(' | ')} |`;
  };

  lines.push(renderRow(rows[0]));
  lines.push(`|${' --- |'.repeat(colCount)}`);
  for (let r = 1; r < rowCount; r++) {
    lines.push(renderRow(rows[r]));
  }

  const notes: string[] = [];
  if (rows.length > rowCount) notes.push(`共 ${rows.length} 行，仅保留前 ${rowCount} 行`);
  if (totalCols > colCount) notes.push(`共 ${totalCols} 列，仅保留前 ${colCount} 列`);
  if (notes.length) lines.push(`[已截断：${notes.join('；')}]`);
  return lines.join('\n');
}

export function workbookRowsToText(sheets: SheetRows[], maxChars: number): ExtractedText {
  const warnings: AttachmentIssue[] = [];
  const kept = sheets.slice(0, MAX_SHEETS_PER_WORKBOOK);
  const segments = kept.map(sheetRowsToMarkdown);
  if (sheets.length > kept.length) {
    segments.push(`[已截断：工作簿共 ${sheets.length} 个 sheet，仅保留前 ${kept.length} 个]`);
  }
  const { content, truncated } = truncateExtractedText(segments.join('\n\n'), maxChars);
  const anyRowTruncated = kept.some(sheet => sheet.rows.length > MAX_ROWS_PER_SHEET);
  const anyTruncated = truncated || sheets.length > kept.length || anyRowTruncated;
  if (anyTruncated) warnings.push({ code: 'attachment.truncated' });
  return { content, truncated: anyTruncated, warnings };
}

// .xlsx/.xls → Markdown 表格文本。SheetJS 由 vendor 运行时懒加载。
export async function extractWorkbook(buffer: ArrayBuffer, maxChars: number): Promise<ExtractedText> {
  const XLSX = await loadXlsxRuntime();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheets: SheetRows[] = workbook.SheetNames.map((name: string) => ({
    name,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    }) as unknown[][],
  }));
  return workbookRowsToText(sheets, maxChars);
}
