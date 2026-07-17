import { describe, expect, it, vi } from 'vitest';
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_IMAGES_PER_MESSAGE,
  MAX_TOTAL_EXTRACTED_CHARS,
  MAX_TOTAL_IMAGE_BINARY_BYTES,
} from '../limits';
import type { PendingSnapshot } from '../processor';

vi.mock('../image', () => ({
  processImageFile: vi.fn(() => Promise.resolve({
    url: 'data:image/jpeg;base64,x',
    originalBytes: 1000,
    finalBytes: 500,
    compressed: true,
    warnings: [],
  })),
}));

import { processAttachments } from '../processor';

const emptySnapshot: PendingSnapshot = {
  imageCount: 0,
  videoCount: 0,
  attachmentCount: 0,
  totalRawBytes: 0,
  extractedChars: 0,
  imageBinaryBytes: 0,
};

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type });
}

describe('processAttachments', () => {
  it('extracts a plain text file', async () => {
    const result = await processAttachments([makeFile('notes.txt', 'hello world', 'text/plain')], emptySnapshot);
    expect(result.errors).toHaveLength(0);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].origin).toBe('text');
    expect(result.files[0].content).toBe('hello world');
  });

  it('keeps csv as raw text instead of parsing as a sheet', async () => {
    const result = await processAttachments([makeFile('data.csv', 'a,b\n1,2', 'text/csv')], emptySnapshot);
    expect(result.files[0].origin).toBe('text');
    expect(result.files[0].content).toBe('a,b\n1,2');
  });

  it('rejects unsupported types per-file without failing the batch', async () => {
    const result = await processAttachments([
      makeFile('binary.exe', 'xx', 'application/x-msdownload'),
      makeFile('ok.txt', 'fine', 'text/plain'),
    ], emptySnapshot);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].issue.code).toBe('attachment.unsupported_type');
    expect(result.files).toHaveLength(1);
  });

  it('accepts a video as a data-url media attachment', async () => {
    const result = await processAttachments([makeFile('clip.mp4', 'vvvv', 'video/mp4')], emptySnapshot);
    expect(result.errors).toHaveLength(0);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].mediaKind).toBe('video');
    expect(result.images[0].url.startsWith('data:video/mp4;base64,')).toBe(true);
    expect(result.images[0].compressed).toBe(false);
    expect(result.images[0].warnings[0].code).toBe('attachment.video_gemini_only');
  });

  it('infers video content type from extension when the browser gives none', async () => {
    const result = await processAttachments([makeFile('clip.mov', 'vvvv', '')], emptySnapshot);
    expect(result.errors).toHaveLength(0);
    expect(result.images[0].url.startsWith('data:video/quicktime;base64,')).toBe(true);
  });

  it('enforces the one-video-per-message limit', async () => {
    const snapshot: PendingSnapshot = { ...emptySnapshot, videoCount: 1 };
    const result = await processAttachments([makeFile('two.mp4', 'x', 'video/mp4')], snapshot);
    expect(result.errors[0].issue.code).toBe('attachment.too_many_videos');
  });

  it('counts video bytes against the shared media binary budget', async () => {
    const snapshot: PendingSnapshot = { ...emptySnapshot, imageBinaryBytes: MAX_TOTAL_IMAGE_BINARY_BYTES - 1 };
    const result = await processAttachments([makeFile('clip.mp4', 'vv', 'video/mp4')], snapshot);
    expect(result.errors[0].issue.code).toBe('attachment.image_total_too_large');
  });

  it('enforces the attachment count limit including existing pending items', async () => {
    const snapshot: PendingSnapshot = { ...emptySnapshot, attachmentCount: MAX_ATTACHMENTS_PER_MESSAGE };
    const result = await processAttachments([makeFile('late.txt', 'x', 'text/plain')], snapshot);
    expect(result.errors[0].issue.code).toBe('attachment.too_many');
  });

  it('enforces the image count limit', async () => {
    const snapshot: PendingSnapshot = { ...emptySnapshot, imageCount: MAX_IMAGES_PER_MESSAGE };
    const result = await processAttachments([makeFile('a.png', 'x', 'image/png')], snapshot);
    expect(result.errors[0].issue.code).toBe('attachment.too_many_images');
  });

  it('enforces the extracted-chars budget', async () => {
    const snapshot: PendingSnapshot = { ...emptySnapshot, extractedChars: MAX_TOTAL_EXTRACTED_CHARS };
    const result = await processAttachments([makeFile('big.txt', 'content', 'text/plain')], snapshot);
    expect(result.errors[0].issue.code).toBe('attachment.extract_budget_exhausted');
  });

  it('enforces the per-message image binary budget', async () => {
    const snapshot: PendingSnapshot = { ...emptySnapshot, imageBinaryBytes: MAX_TOTAL_IMAGE_BINARY_BYTES - 100 };
    const result = await processAttachments([makeFile('big.png', 'x', 'image/png')], snapshot);
    expect(result.errors[0].issue.code).toBe('attachment.image_total_too_large');
    expect(result.images).toHaveLength(0);
  });

  it('processes images through the compression pipeline', async () => {
    const result = await processAttachments([makeFile('pic.png', 'x', 'image/png')], emptySnapshot);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].compressed).toBe(true);
    expect(result.images[0].url.startsWith('data:image/jpeg')).toBe(true);
  });

  it('routes .html files to webpage extraction', async () => {
    const result = await processAttachments([
      makeFile('page.html', '<html><head><title>T</title></head><body><p>body text</p></body></html>', 'text/html'),
    ], emptySnapshot);
    expect(result.files[0].origin).toBe('webpage');
    expect(result.files[0].content).toContain('body text');
    expect(result.files[0].content).not.toContain('<p>');
  });

  it('flags empty files', async () => {
    const result = await processAttachments([makeFile('empty.txt', '   ', 'text/plain')], emptySnapshot);
    expect(result.errors[0].issue.code).toBe('attachment.empty_content');
  });
});
