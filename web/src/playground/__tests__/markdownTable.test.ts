import { describe, expect, it } from 'vitest';
import { isTableLine, parseMarkdownTable } from '../markdownTable';

describe('isTableLine', () => {
  it('以 | 开头的行视为候选表格行', () => {
    expect(isTableLine('| a | b |')).toBe(true);
    expect(isTableLine('  | a |')).toBe(true);
  });

  it('普通文本与空行不是表格行', () => {
    expect(isTableLine('hello | world')).toBe(false);
    expect(isTableLine('')).toBe(false);
    expect(isTableLine('   ')).toBe(false);
  });
});

describe('parseMarkdownTable', () => {
  it('解析标准 GFM 表格（含对齐）', () => {
    const table = parseMarkdownTable([
      '| 名称 | 数量 | 价格 |',
      '| :--- | :--: | ---: |',
      '| 苹果 | 3 | ¥12 |',
      '| 香蕉 | 5 | ¥8 |',
    ]);
    expect(table).not.toBeNull();
    expect(table!.header).toEqual(['名称', '数量', '价格']);
    expect(table!.align).toEqual(['left', 'center', 'right']);
    expect(table!.rows).toEqual([
      ['苹果', '3', '¥12'],
      ['香蕉', '5', '¥8'],
    ]);
  });

  it('无前后竖线的紧凑写法也能解析', () => {
    const table = parseMarkdownTable([
      'a | b',
      '--- | ---',
      '1 | 2',
    ]);
    expect(table).not.toBeNull();
    expect(table!.header).toEqual(['a', 'b']);
    expect(table!.rows).toEqual([['1', '2']]);
  });

  it('数据行列数不齐时按表头列数截断或补空', () => {
    const table = parseMarkdownTable([
      '| a | b | c |',
      '| --- | --- | --- |',
      '| 1 | 2 |',
      '| 1 | 2 | 3 | 4 |',
    ]);
    expect(table!.rows).toEqual([
      ['1', '2', ''],
      ['1', '2', '3'],
    ]);
  });

  it('单元格内转义竖线 \\| 保留为字面量', () => {
    const table = parseMarkdownTable([
      '| 表达式 | 说明 |',
      '| --- | --- |',
      '| a \\| b | 或运算 |',
    ]);
    expect(table!.rows[0][0]).toBe('a | b');
  });

  it('单元格内其余转义序列原样保留（交给行内渲染处理）', () => {
    const table = parseMarkdownTable([
      '| a | b |',
      '| --- | --- |',
      '| \\*x\\* | y |',
    ]);
    expect(table!.rows[0][0]).toBe('\\*x\\*');
  });

  it('短横线分隔（GFM 允许 1+ 连字符）也可解析', () => {
    expect(parseMarkdownTable(['| a | b |', '| - | - |', '| 1 | 2 |'])).not.toBeNull();
  });

  it('分隔行不合法则整体不是表格', () => {
    expect(parseMarkdownTable(['| a | b |', '| 文字 | --- |'])).toBeNull();
    expect(parseMarkdownTable(['| a | b |', '| === | === |'])).toBeNull();
    expect(parseMarkdownTable(['| a | b |'])).toBeNull();
  });

  it('表头与分隔行列数不一致则不是表格', () => {
    expect(parseMarkdownTable(['| a | b | c |', '| --- | --- |'])).toBeNull();
  });

  it('单列表格不按表格渲染（避免误伤普通竖线文本）', () => {
    expect(parseMarkdownTable(['| a |', '| --- |', '| 1 |'])).toBeNull();
  });
});
