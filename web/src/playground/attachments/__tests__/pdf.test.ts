import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AttachmentError } from '../types';

const getDocumentMock = vi.fn();

vi.mock('../vendor', () => ({
  loadPdfJsRuntime: () => Promise.resolve({
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: getDocumentMock,
  }),
}));

import { assemblePageText, extractPdf, looksLikeScannedPdf } from '../pdf';

function fakeDoc(pages: string[][]) {
  return {
    numPages: pages.length,
    getPage: (n: number) => Promise.resolve({
      getTextContent: () => Promise.resolve({
        items: pages[n - 1].map(str => ({ str, hasEOL: true })),
      }),
    }),
    destroy: () => Promise.resolve(),
  };
}

beforeEach(() => {
  getDocumentMock.mockReset();
});

describe('assemblePageText', () => {
  it('concatenates items without injecting spaces and honors hasEOL', () => {
    const text = assemblePageText([
      { str: 'first ' }, { str: 'line', hasEOL: true },
      { str: 'second line' },
    ]);
    expect(text).toBe('first line\nsecond line');
  });

  it('keeps split words and numbers intact', () => {
    expect(assemblePageText([{ str: 'attach' }, { str: 'ment 12' }, { str: '345' }])).toBe('attachment 12345');
  });
});

describe('looksLikeScannedPdf', () => {
  it('flags pages with almost no text', () => {
    expect(looksLikeScannedPdf(10, 5)).toBe(true);
    expect(looksLikeScannedPdf(5000, 5)).toBe(false);
  });
});

describe('extractPdf', () => {
  it('extracts text with page markers', async () => {
    const body = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do.';
    getDocumentMock.mockReturnValue({ promise: Promise.resolve(fakeDoc([[body], [body]])) });

    const result = await extractPdf(new ArrayBuffer(8), 10_000);
    expect(result.content).toContain('[Page 1]');
    expect(result.content).toContain('[Page 2]');
    expect(result.content).toContain('Lorem ipsum');
  });

  it('throws a structured error for encrypted pdfs', async () => {
    const err = new Error('locked');
    err.name = 'PasswordException';
    getDocumentMock.mockReturnValue({ promise: Promise.reject(err) });

    await expect(extractPdf(new ArrayBuffer(8), 10_000)).rejects.toMatchObject({
      issue: { code: 'attachment.pdf_encrypted' },
    });
  });

  it('throws for pdfs with no text layer', async () => {
    getDocumentMock.mockReturnValue({ promise: Promise.resolve(fakeDoc([[''], ['']])) });

    await expect(extractPdf(new ArrayBuffer(8), 10_000)).rejects.toBeInstanceOf(AttachmentError);
  });

  it('warns when text density is low but nonzero', async () => {
    getDocumentMock.mockReturnValue({ promise: Promise.resolve(fakeDoc([['tiny'], ['also tiny']])) });

    const result = await extractPdf(new ArrayBuffer(8), 10_000);
    expect(result.warnings.some(w => w.code === 'attachment.pdf_maybe_scanned')).toBe(true);
  });
});
