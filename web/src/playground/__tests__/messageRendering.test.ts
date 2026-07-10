import { describe, expect, it } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderMessageContent } from '../MessageRendering';

function renderToHtml(content: string): string {
  return renderToStaticMarkup(createElement('div', null, renderMessageContent(content) as ReactNode));
}

describe('renderMessageContent 块级渲染', () => {
  it('GFM 表格渲染为 table，含表头与数据行', () => {
    const html = renderToHtml([
      '对比如下：',
      '',
      '| 方案 | 成本 |',
      '| --- | ---: |',
      '| A | **低** |',
      '| B | 高 |',
    ].join('\n'));
    expect(html).toContain('<table');
    expect(html).toContain('<th');
    expect(html).toContain('方案');
    expect(html).toContain('<strong>低</strong>');
    expect(html).toContain('text-align:right');
  });

  it('不合法的竖线行回退为普通文本，内容不丢', () => {
    const html = renderToHtml('| 只有一行竖线文本 |');
    expect(html).not.toContain('<table');
    expect(html).toContain('只有一行竖线文本');
  });

  it('代码块带语言标签与复制按钮', () => {
    const html = renderToHtml('```python\nprint("hi")\n```');
    expect(html).toContain('<pre');
    expect(html).toContain('python');
    expect(html).toContain('复制');
    expect(html).toContain('print(&quot;hi&quot;)');
  });

  it('无语言代码块回退 code 标签', () => {
    const html = renderToHtml('```\nplain\n```');
    expect(html).toContain('>code<');
  });

  it('嵌套列表渲染出层级 ul', () => {
    const html = renderToHtml('- 一\n  - 一.1\n- 二');
    const nestedUl = html.match(/<ul/g);
    expect(nestedUl?.length).toBe(2);
    expect(html).toContain('一.1');
  });

  it('有序与无序可嵌套混用', () => {
    const html = renderToHtml('1. 步骤一\n  - 注意点\n2. 步骤二');
    expect(html).toContain('<ol');
    expect(html).toContain('<ul');
  });

  it('任务列表渲染勾选框', () => {
    const html = renderToHtml('- [x] 已完成\n- [ ] 待办');
    expect(html).toContain('✓');
    expect(html).toContain('已完成');
    expect(html).toContain('待办');
    expect(html).not.toContain('[x]');
  });

  it('删除线渲染为 del', () => {
    const html = renderToHtml('~~作废~~ 有效');
    expect(html).toContain('<del');
    expect(html).toContain('作废');
  });

  it('表格后接普通段落时两者都渲染', () => {
    const html = renderToHtml('| a | b |\n| - | - |\n| 1 | 2 |\n\n结论如上。');
    expect(html).toContain('<table');
    expect(html).toContain('结论如上。');
  });

  it('用户消息文件块折叠为 chip 且与表格共存', () => {
    const html = renderToStaticMarkup(createElement('div', null, renderMessageContent(
      '分析\n\n<file name="a.xlsx" type="x" size="10">\n| h1 | h2 |\n</file>',
      { parseFileBlocks: true },
    ) as ReactNode));
    expect(html).toContain('a.xlsx');
    expect(html).toContain('<details');
  });
});
