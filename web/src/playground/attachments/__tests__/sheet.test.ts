import { describe, expect, it } from 'vitest';
import { MAX_ROWS_PER_SHEET, MAX_SHEETS_PER_WORKBOOK } from '../limits';
import { sheetRowsToMarkdown, workbookRowsToText } from '../sheet';

describe('sheetRowsToMarkdown', () => {
  it('renders a markdown table with header separator', () => {
    const md = sheetRowsToMarkdown({ name: 'S1', rows: [['name', 'qty'], ['apple', 3]] });
    expect(md).toContain('## Sheet: S1');
    expect(md).toContain('| name | qty |');
    expect(md).toContain('| --- | --- |');
    expect(md).toContain('| apple | 3 |');
  });

  it('escapes pipes and collapses newlines in cells', () => {
    const md = sheetRowsToMarkdown({ name: 'S', rows: [['a|b', 'x\ny']] });
    expect(md).toContain('a\\|b');
    expect(md).toContain('x y');
  });

  it('marks empty sheets', () => {
    expect(sheetRowsToMarkdown({ name: 'Empty', rows: [] })).toContain('(空表)');
  });

  it('truncates rows beyond the limit', () => {
    const rows = Array.from({ length: MAX_ROWS_PER_SHEET + 50 }, (_, i) => [`r${i}`]);
    const md = sheetRowsToMarkdown({ name: 'Big', rows });
    expect(md).toContain(`仅保留前 ${MAX_ROWS_PER_SHEET} 行`);
    expect(md).not.toContain(`r${MAX_ROWS_PER_SHEET + 10}`);
  });
});

describe('workbookRowsToText', () => {
  it('caps the number of sheets', () => {
    const sheets = Array.from({ length: MAX_SHEETS_PER_WORKBOOK + 5 }, (_, i) => ({
      name: `sheet${i}`,
      rows: [['a']],
    }));
    const result = workbookRowsToText(sheets, 1_000_000);
    expect(result.truncated).toBe(true);
    expect(result.content).toContain(`仅保留前 ${MAX_SHEETS_PER_WORKBOOK} 个`);
    expect(result.content).not.toContain(`## Sheet: sheet${MAX_SHEETS_PER_WORKBOOK + 1}`);
  });

  it('respects the char budget', () => {
    const sheets = [{ name: 'S', rows: Array.from({ length: 100 }, (_, i) => [`row-${i}`, 'value']) }];
    const result = workbookRowsToText(sheets, 200);
    expect(result.truncated).toBe(true);
    expect(result.content.length).toBeLessThan(400);
  });
});
