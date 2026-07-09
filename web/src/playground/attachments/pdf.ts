import { MAX_PDF_CHARS, MAX_PDF_PAGES, SCANNED_PDF_CHARS_PER_PAGE } from './limits';
import { loadPdfJsRuntime, type PdfTextItem } from './vendor';
import { truncateExtractedText } from './textExtract';
import { AttachmentError, type AttachmentIssue, type ExtractedText } from './types';

// 页内文本拼接：items 直接串接（item.str 自带词间空格；注入空格会把
// 因字体/样式切分的词和数字撕开，如 '12'+'345' → '12 345'），hasEOL 转换行。
export function assemblePageText(items: PdfTextItem[]): string {
  const parts: string[] = [];
  for (const item of items) {
    if (item.str) parts.push(item.str);
    if (item.hasEOL) parts.push('\n');
  }
  return parts
    .join('')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// 平均每页字符过少 → 判定扫描件（无文本层，需要 OCR）。
export function looksLikeScannedPdf(totalChars: number, pageCount: number): boolean {
  if (pageCount <= 0) return false;
  return totalChars / pageCount < SCANNED_PDF_CHARS_PER_PAGE;
}

// 文本型 PDF 抽取：保留 [Page N] 页码标记；加密/损坏抛结构化错误。
export async function extractPdf(buffer: ArrayBuffer, maxChars = MAX_PDF_CHARS): Promise<ExtractedText> {
  const pdfjs = await loadPdfJsRuntime();
  const warnings: AttachmentIssue[] = [];

  let doc;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'PasswordException') {
      throw new AttachmentError({ code: 'attachment.pdf_encrypted' });
    }
    throw new AttachmentError({ code: 'attachment.pdf_parse_failed' });
  }

  try {
    const pageCount = Math.min(doc.numPages, MAX_PDF_PAGES);
    if (doc.numPages > MAX_PDF_PAGES) {
      warnings.push({ code: 'attachment.pdf_pages_truncated', params: { total: doc.numPages, kept: MAX_PDF_PAGES } });
    }

    const segments: string[] = [];
    let totalChars = 0;
    let processedPages = 0;
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const textContent = await page.getTextContent();
      page.cleanup?.();
      const pageText = assemblePageText(textContent.items);
      segments.push(`[Page ${pageNumber}]\n${pageText}`);
      totalChars += pageText.length;
      processedPages = pageNumber;
      if (totalChars >= maxChars) break;
    }

    if (looksLikeScannedPdf(totalChars, processedPages)) {
      if (totalChars === 0) {
        throw new AttachmentError({ code: 'attachment.pdf_scanned' });
      }
      warnings.push({ code: 'attachment.pdf_maybe_scanned' });
    }
    if (processedPages < pageCount) {
      warnings.push({ code: 'attachment.pdf_pages_truncated', params: { total: doc.numPages, kept: processedPages } });
    }

    const { content, truncated } = truncateExtractedText(segments.join('\n\n'), maxChars);
    if (truncated) warnings.push({ code: 'attachment.truncated' });
    return { content, truncated: truncated || processedPages < doc.numPages, warnings };
  } finally {
    void doc.destroy().catch(() => {});
  }
}
