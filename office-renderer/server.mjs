import http from 'node:http';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  TableLayoutType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  LevelFormat,
} from 'docx';
import { marked } from 'marked';
import pptxgen from 'pptxgenjs';

const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 20 * 1024 * 1024;
const MAX_CONCURRENCY = 2;
let activeRenders = 0;

const cleanText = (value, max = 10000) => {
  const text = String(value ?? '').replaceAll('\u0000', '').trim();
  if (text.length > max) throw new Error(`text exceeds ${max} characters`);
  return text;
};

const cleanInlineText = (value, max = 10000) => {
  const text = String(value ?? '').replaceAll('\u0000', '');
  if (text.length > max) throw new Error(`text exceeds ${max} characters`);
  return text;
};

function inlineRuns(tokens = [], inherited = {}) {
  const runs = [];
  for (const token of tokens) {
    if (token.type === 'strong') {
      runs.push(...inlineRuns(token.tokens, { ...inherited, bold: true }));
    } else if (token.type === 'em') {
      runs.push(...inlineRuns(token.tokens, { ...inherited, italics: true }));
    } else if (token.type === 'del') {
      runs.push(...inlineRuns(token.tokens, { ...inherited, strike: true }));
    } else if (token.type === 'codespan') {
      runs.push(new TextRun({ text: cleanInlineText(token.text), font: 'Courier New', shading: { fill: 'F3F4F6', type: ShadingType.CLEAR }, ...inherited }));
    } else if (token.type === 'br') {
      runs.push(new TextRun({ break: 1, text: '', ...inherited }));
    } else if (token.tokens) {
      runs.push(...inlineRuns(token.tokens, inherited));
    } else {
      const text = cleanInlineText(token.text ?? token.raw ?? '', 10000);
      if (text) runs.push(new TextRun({ text, font: 'Arial', ...inherited }));
    }
  }
  return runs;
}

function paragraphFromToken(token, options = {}) {
  const children = inlineRuns(token.tokens ?? [{ type: 'text', text: token.text ?? '' }]);
  return new Paragraph({ children: children.length ? children : [new TextRun('')], spacing: { after: 120 }, ...options });
}

function codeParagraphs(value) {
  const lines = cleanInlineText(value, 512 * 1024).replaceAll('\r\n', '\n').split('\n');
  if (lines.length > 1 && lines.at(-1) === '') lines.pop();
  return lines.map((line, index) => new Paragraph({
    children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 18 })],
    shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
    spacing: { before: index === 0 ? 80 : 0, after: index === lines.length - 1 ? 140 : 0, line: 240 },
  }));
}

function tableFromToken(token) {
	const tableWidth = 9360;
	const columnCount = Math.max(token.header.length, 1);
	const columnWidth = Math.floor(tableWidth / columnCount);
	const columnWidths = Array.from({ length: columnCount }, (_, index) => (
		index === columnCount - 1 ? tableWidth - columnWidth * (columnCount - 1) : columnWidth
	));
  const header = new TableRow({
    tableHeader: true,
    children: token.header.map((cell, index) => new TableCell({
		width: { size: columnWidths[index], type: WidthType.DXA },
		margins: { top: 100, bottom: 100, left: 120, right: 120 },
		verticalAlign: 'center',
      shading: { fill: 'E8EEF8', type: ShadingType.CLEAR },
      children: [paragraphFromToken(cell, { alignment: AlignmentType.LEFT })],
    })),
  });
  const rows = token.rows.map((row) => new TableRow({
		children: token.header.map((_, index) => new TableCell({
			width: { size: columnWidths[index], type: WidthType.DXA },
			margins: { top: 100, bottom: 100, left: 120, right: 120 },
			verticalAlign: 'center',
			children: [paragraphFromToken(row[index] ?? { type: 'text', text: '' })],
		})),
  }));
  return new Table({
		width: { size: tableWidth, type: WidthType.DXA },
		columnWidths,
		indent: { size: 120, type: WidthType.DXA },
		layout: TableLayoutType.FIXED,
		margins: { top: 80, bottom: 80, left: 120, right: 120 },
    borders: {
      top: { style: BorderStyle.SINGLE, color: 'D1D5DB', size: 1 },
      bottom: { style: BorderStyle.SINGLE, color: 'D1D5DB', size: 1 },
      left: { style: BorderStyle.SINGLE, color: 'D1D5DB', size: 1 },
      right: { style: BorderStyle.SINGLE, color: 'D1D5DB', size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, color: 'E5E7EB', size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, color: 'E5E7EB', size: 1 },
    },
    rows: [header, ...rows],
  });
}

function markdownChildren(markdown) {
  const tokens = marked.lexer(cleanText(markdown, 512 * 1024), { gfm: true });
  const children = [];
  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        children.push(paragraphFromToken(token, {
          heading: [HeadingLevel.TITLE, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][Math.min(token.depth, 4) - 1],
          spacing: { before: 180, after: 100 },
        }));
        break;
      case 'paragraph':
      case 'text':
        children.push(paragraphFromToken(token));
        break;
      case 'blockquote':
        children.push(paragraphFromToken({ tokens: token.tokens?.flatMap((item) => item.tokens ?? []) ?? [] }, {
          indent: { left: 360 },
          border: { left: { style: BorderStyle.SINGLE, color: '94A3B8', size: 8, space: 8 } },
        }));
        break;
      case 'code':
        children.push(...codeParagraphs(token.text));
        break;
      case 'list':
        token.items.forEach((item) => {
          const runs = inlineRuns(item.tokens?.flatMap((part) => part.tokens ?? [part]) ?? []);
          children.push(new Paragraph({
            children: runs,
            bullet: token.ordered ? undefined : { level: 0 },
            numbering: token.ordered ? { reference: 'ordered-list', level: 0 } : undefined,
            spacing: { after: 80, line: 280 },
          }));
        });
        break;
      case 'table':
        children.push(tableFromToken(token));
        children.push(new Paragraph(''));
        break;
      case 'hr':
        children.push(new Paragraph({ children: [new PageBreak()] }));
        break;
      case 'space':
        break;
      default:
        if (token.raw?.trim()) children.push(new Paragraph(cleanText(token.raw)));
    }
  }
  return children;
}

export async function renderDocx(input) {
  const title = cleanText(input?.title, 120);
  const content = cleanText(input?.content, 512 * 1024);
  if (!title || !content) throw new Error('title and content are required');
  const document = new Document({
    creator: 'HopBase AI Chat',
    title,
    numbering: {
      config: [{
        reference: 'ordered-list',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: 'left',
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 }, paragraph: { spacing: { line: 300, after: 120 } } } },
		paragraphStyles: [
			{
				id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true,
				run: { font: 'Arial', size: 42, bold: true, color: '0F172A' },
				paragraph: { spacing: { before: 0, after: 240 }, outlineLevel: 0 },
			},
			{
				id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
				run: { font: 'Arial', size: 32, bold: true, color: '0F172A' },
				paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 },
			},
			{
				id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
				run: { font: 'Arial', size: 26, bold: true, color: '2563EB' },
				paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 },
			},
			{
				id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
				run: { font: 'Arial', size: 23, bold: true, color: '334155' },
				paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 },
			},
		],
    },
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.TITLE, spacing: { after: 240 } }),
        ...markdownChildren(content),
      ],
    }],
  });
  return Packer.toBuffer(document);
}

function validatePresentation(input) {
  const title = cleanText(input?.title, 120);
  if (!title || !Array.isArray(input?.slides) || input.slides.length < 1 || input.slides.length > 15) {
    throw new Error('title and 1-15 slides are required');
  }
  return {
    title,
    slides: input.slides.map((slide, index) => {
      const kind = slide?.kind;
      if (!['title', 'content', 'table'].includes(kind)) throw new Error(`slide ${index + 1} has invalid kind`);
      const normalized = {
        kind,
        title: cleanText(slide.title, 100),
        subtitle: cleanText(slide.subtitle, 300),
        bullets: Array.isArray(slide.bullets) ? slide.bullets.map((item) => cleanText(item, 240)) : [],
        table: slide.table,
      };
      if (!normalized.title || normalized.bullets.length > 8) throw new Error(`slide ${index + 1} exceeds text limits`);
      if (kind === 'table') {
        const headers = slide.table?.headers;
        const rows = slide.table?.rows;
        if (!Array.isArray(headers) || headers.length < 1 || headers.length > 8 || !Array.isArray(rows) || rows.length > 20) {
          throw new Error(`slide ${index + 1} has invalid table`);
        }
        normalized.table = {
          headers: headers.map((cell) => cleanText(cell, 120)),
          rows: rows.map((row) => {
            if (!Array.isArray(row) || row.length > headers.length) throw new Error(`slide ${index + 1} has invalid table row`);
            return row.map((cell) => cleanText(cell, 200));
          }),
        };
      }
      return normalized;
    }),
  };
}

export async function renderPptx(rawInput) {
  const input = validatePresentation(rawInput);
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'HopBase AI Chat';
  pptx.company = 'HopBase';
  pptx.subject = input.title;
  pptx.title = input.title;
  pptx.lang = 'zh-TW';
  pptx.theme = {
    headFontFace: 'Arial', bodyFontFace: 'Arial', lang: 'zh-TW',
  };
  pptx.defineSlideMaster({
    title: 'HOPBASE_CONTENT',
    background: { color: 'FFFFFF' },
    objects: [
      { rect: { x: 0, y: 0, w: 13.333, h: 0.08, fill: { color: '2563EB' }, line: { color: '2563EB' } } },
      { text: { text: input.title, options: { x: 0.65, y: 7.1, w: 10.5, h: 0.2, fontFace: 'Arial', fontSize: 8, color: '94A3B8', margin: 0 } } },
    ],
    slideNumber: { x: 12.1, y: 7.05, w: 0.5, h: 0.25, fontFace: 'Arial', fontSize: 8, color: '94A3B8', align: 'right' },
  });

  for (const item of input.slides) {
    const slide = item.kind === 'title' ? pptx.addSlide() : pptx.addSlide('HOPBASE_CONTENT');
    slide.background = { color: item.kind === 'title' ? 'F8FAFC' : 'FFFFFF' };
    if (item.kind === 'title') {
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: '2563EB' }, line: { color: '2563EB' } });
      slide.addText(item.title, { x: 0.95, y: 2.15, w: 11.2, h: 1.25, fontFace: 'Arial', fontSize: 44, bold: true, color: '0F172A', margin: 0, breakLine: false, fit: 'shrink' });
      if (item.subtitle) slide.addText(item.subtitle, { x: 0.98, y: 3.55, w: 10.8, h: 0.8, fontFace: 'Arial', fontSize: 16, color: '475569', margin: 0, fit: 'shrink' });
      continue;
    }
    slide.addText(item.title, { x: 0.65, y: 0.42, w: 12, h: 0.58, fontFace: 'Arial', fontSize: 32, bold: true, color: '0F172A', margin: 0, fit: 'shrink' });
    if (item.kind === 'content') {
      const bulletRuns = item.bullets.map((text) => ({ text, options: { bullet: { indent: 18 }, breakLine: true, hanging: 4 } }));
      slide.addText(bulletRuns, { x: 0.9, y: 1.35, w: 11.4, h: 5.35, fontFace: 'Arial', fontSize: 20, color: '1E293B', breakLine: false, margin: 0.08, paraSpaceAfterPt: 14, valign: 'top', fit: 'shrink' });
      if (item.subtitle) slide.addText(item.subtitle, { x: 0.68, y: 1.02, w: 11.6, h: 0.3, fontFace: 'Arial', fontSize: 11, color: '64748B', margin: 0, fit: 'shrink' });
    } else {
      const tableY = item.subtitle ? 1.38 : 1.25;
      const availableTableHeight = item.subtitle ? 5.22 : 5.35;
      if (item.subtitle) slide.addText(item.subtitle, { x: 0.68, y: 1.02, w: 11.6, h: 0.25, fontFace: 'Arial', fontSize: 11, color: '64748B', margin: 0, fit: 'shrink' });
      const headerCells = item.table.headers.map((text) => ({
        text,
        options: { bold: true, color: '1E3A8A', fill: { color: 'E8EEF8' } },
      }));
      const tableRows = [headerCells, ...item.table.rows];
      const tableRowHeight = Math.min(0.52, availableTableHeight / Math.max(tableRows.length, 1));
      const denseTable = tableRows.length > 15;
      const tableFontSize = denseTable ? 9 : (tableRows.length > 10 ? 10 : (item.table.headers.length > 5 ? 12 : 14));
      slide.addTable(tableRows, {
        x: 0.65, y: tableY, w: 12.0, h: tableRowHeight * tableRows.length,
        border: { type: 'solid', color: 'CBD5E1', pt: 0.8 },
        fill: { color: 'FFFFFF' }, color: '1E293B', fontFace: 'Arial', fontSize: tableFontSize,
        margin: denseTable ? 0.03 : 0.08, valign: 'mid', autoFit: false,
        bold: false,
        rowH: tableRowHeight,
      });
    }
  }
  const output = await pptx.write({ outputType: 'nodebuffer', compression: true });
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
}

async function readJSON(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('request body exceeds 4MB');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleRender(req, res, renderer, contentType) {
  if (activeRenders >= MAX_CONCURRENCY) {
    res.writeHead(429, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'renderer busy' }));
    return;
  }
  activeRenders += 1;
  try {
    const output = await renderer(await readJSON(req));
    if (output.length > MAX_OUTPUT_BYTES) throw new Error('rendered file exceeds 20MB');
    res.writeHead(200, {
      'content-type': contentType,
      'content-length': output.length,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    res.end(output);
  } catch (error) {
    res.writeHead(400, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'render failed' }));
  } finally {
    activeRenders -= 1;
  }
}

export function createServer() {
  return http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ ok: true, active_renders: activeRenders }));
    } else if (req.method === 'POST' && req.url === '/render/docx') {
      void handleRender(req, res, renderDocx, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } else if (req.method === 'POST' && req.url === '/render/pptx') {
      void handleRender(req, res, renderPptx, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    } else {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
    }
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 8787);
  const server = createServer();
  server.listen(port, host, () => process.stdout.write(`office-renderer listening on ${host}:${port}\n`));
}
