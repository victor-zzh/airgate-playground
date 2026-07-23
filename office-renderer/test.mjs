import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import { renderDocx, renderPptx } from './server.mjs';

function wordText(xml) {
  return [...xml.matchAll(/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g)].map((match) => match[1]).join('');
}

function assertSlideShapesInsideCanvas(xml) {
  const maxX = Math.ceil(13.334 * 914400);
  const maxY = Math.ceil(7.501 * 914400);
  const transforms = [...xml.matchAll(/<(?:a|p):off x="(\d+)" y="(\d+)"\/><(?:a|p):ext cx="(\d+)" cy="(\d+)"\/>/g)];
  assert.ok(transforms.length > 0, 'slide has no positioned shapes');
  for (const [, x, y, width, height] of transforms) {
    assert.ok(Number(x) + Number(width) <= maxX, `shape exceeds slide width: ${x}+${width}`);
    assert.ok(Number(y) + Number(height) <= maxY, `shape exceeds slide height: ${y}+${height}`);
  }
}

test('renders valid DOCX package', async () => {
  const output = await renderDocx({ title: '测试报告', content: '# 摘要\n\n- 第一项\n- 第二项\n\n| 列A | 列B |\n| --- | --- |\n| 1 | 2 |' });
  assert.equal(output.subarray(0, 2).toString('hex'), '504b');
  assert.ok(output.length > 1000);
  const archive = await JSZip.loadAsync(output);
  const documentXml = await archive.file('word/document.xml').async('string');
  assert.match(documentXml, /测试报告/);
  assert.match(documentXml, /第一项/);
  assert.match(documentXml, /<w:tbl>/);
  assert.match(documentXml, /w:val="Title"/);
});

test('preserves long multilingual DOCX content, inline spaces, and wide fixed tables', async () => {
  const paragraphs = Array.from({ length: 160 }, (_, index) => `段落 ${index + 1}：中文、日本語、English and العربية。`);
  const table = [
    '| 一 | 二 | 三 | 四 | 五 | 六 | 七 | 八 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    '| A | B | C | D | E | F | G | TABLE-END |',
  ].join('\n');
  const content = `## START-MARKER\n\n中文 **粗体** 后缀\n\n${paragraphs.join('\n\n')}\n\n${table}\n\nEND-MARKER`;
  const output = await renderDocx({ title: '多语言长报告', content });
  const archive = await JSZip.loadAsync(output);
  const documentXml = await archive.file('word/document.xml').async('string');
  const text = wordText(documentXml);

  assert.match(text, /START-MARKER/);
  assert.match(text, /中文 粗体 后缀/);
  assert.match(text, /العربية/);
  assert.match(text, /TABLE-END/);
  assert.match(text, /END-MARKER/);
  assert.equal(text.match(/多语言长报告/g)?.length, 1);
  assert.match(documentXml, /<w:tblLayout w:type="fixed"\/>/);
  assert.equal((documentXml.match(/<w:gridCol /g) ?? []).length, 8);
});

test('preserves DOCX code block line breaks, blank lines, and indentation', async () => {
  const output = await renderDocx({
    title: '代码格式',
    content: '```go\nfunc main() {\n    first()\n\n    last()\n}\n```',
  });
  const archive = await JSZip.loadAsync(output);
  const documentXml = await archive.file('word/document.xml').async('string');
  const paragraphs = [...documentXml.matchAll(/<w:p[\s\S]*?<\/w:p>/g)].map((match) => wordText(match[0]));
  const codeStart = paragraphs.indexOf('func main() {');
  assert.ok(codeStart >= 0, 'first code line is missing');
  assert.equal(paragraphs[codeStart + 1], '    first()');
  assert.equal(paragraphs[codeStart + 2], ' ');
  assert.equal(paragraphs[codeStart + 3], '    last()');
  assert.equal(paragraphs[codeStart + 4], '}');
});

test('renders valid PPTX package', async () => {
  const output = await renderPptx({
    title: '季度复盘',
    slides: [
      { kind: 'title', title: '季度复盘', subtitle: '2026 Q3' },
      { kind: 'content', title: '核心进展', bullets: ['增长 20%', '完成关键交付'] },
      { kind: 'table', title: '指标', subtitle: '第 1/2 部分', table: { headers: ['指标', '结果'], rows: [['收入', '120']] } },
    ],
  });
  assert.equal(output.subarray(0, 2).toString('hex'), '504b');
  assert.ok(output.length > 1000);
  const archive = await JSZip.loadAsync(output);
  const slide1 = await archive.file('ppt/slides/slide1.xml').async('string');
  const slide2 = await archive.file('ppt/slides/slide2.xml').async('string');
  const slide3 = await archive.file('ppt/slides/slide3.xml').async('string');
  assert.match(slide1, /季度复盘/);
  assert.match(slide2, /核心进展/);
  assert.match(slide2, /增长 20%/);
  assert.match(slide3, /指标/);
  assert.match(slide3, /第 1\/2 部分/);
  assert.match(slide3, /收入/);
});

test('keeps a 15-slide multilingual PPTX and dense table inside the canvas', async () => {
  const slides = [{ kind: 'title', title: '全球业务复盘', subtitle: '中文 / 日本語 / English' }];
  for (let index = 1; index <= 13; index += 1) {
    slides.push({
      kind: 'content',
      title: `章节 ${index}`,
      bullets: [`要点 ${index}：${'详细内容'.repeat(24)} END-${index}`, 'Revenue 성장 العربية'],
    });
  }
  slides.push({
    kind: 'table',
    title: '20 行明细',
    table: {
      headers: Array.from({ length: 8 }, (_, index) => `列 ${index + 1}`),
      rows: Array.from({ length: 20 }, (_, row) => Array.from({ length: 8 }, (_, column) => `R${row + 1}C${column + 1}`)),
    },
  });

  const output = await renderPptx({ title: '全球业务复盘', slides });
  const archive = await JSZip.loadAsync(output);
  const slideFiles = Object.keys(archive.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  assert.equal(slideFiles.length, 15);
  for (const name of slideFiles) {
    const xml = await archive.file(name).async('string');
    assertSlideShapesInsideCanvas(xml);
  }
  const lastSlide = await archive.file('ppt/slides/slide15.xml').async('string');
  assert.match(lastSlide, /R1C1/);
  assert.match(lastSlide, /R20C8/);
});

test('rejects oversized presentation structures', async () => {
  await assert.rejects(() => renderPptx({ title: 'x', slides: [{ kind: 'content', title: 'x', bullets: Array(9).fill('item') }] }));
});
