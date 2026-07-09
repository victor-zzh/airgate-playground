import { describe, expect, it } from 'vitest';
import { effectiveLadder, scaledDimensions, shouldPassthrough } from '../image';
import { IMAGE_TARGET_BYTES } from '../limits';

describe('shouldPassthrough', () => {
  it('passes small model-friendly images untouched', () => {
    expect(shouldPassthrough({ sizeBytes: 500_000, width: 1200, height: 800, type: 'image/png' })).toBe(true);
    expect(shouldPassthrough({ sizeBytes: 500_000, width: 1200, height: 800, type: 'image/jpeg' })).toBe(true);
  });

  it('compresses images above the size target', () => {
    expect(shouldPassthrough({ sizeBytes: IMAGE_TARGET_BYTES + 1, width: 1200, height: 800, type: 'image/jpeg' })).toBe(false);
  });

  it('compresses images with a long edge above the limit', () => {
    expect(shouldPassthrough({ sizeBytes: 500_000, width: 4000, height: 200, type: 'image/jpeg' })).toBe(false);
  });

  it('transcodes non-model-friendly formats', () => {
    expect(shouldPassthrough({ sizeBytes: 500_000, width: 800, height: 600, type: 'image/bmp' })).toBe(false);
  });

  it('passes compliant gifs untouched to preserve animation', () => {
    expect(shouldPassthrough({ sizeBytes: 500_000, width: 800, height: 600, type: 'image/gif' })).toBe(true);
  });

  it('compresses oversized or huge-dimension gifs (loses animation, warned by caller)', () => {
    expect(shouldPassthrough({ sizeBytes: IMAGE_TARGET_BYTES + 1, width: 800, height: 600, type: 'image/gif' })).toBe(false);
    expect(shouldPassthrough({ sizeBytes: 500_000, width: 4000, height: 3000, type: 'image/gif' })).toBe(false);
  });
});

describe('scaledDimensions', () => {
  it('keeps small images unscaled', () => {
    expect(scaledDimensions(800, 600, 2000)).toEqual({ width: 800, height: 600 });
  });

  it('scales the long edge down preserving aspect ratio', () => {
    expect(scaledDimensions(4000, 2000, 2000)).toEqual({ width: 2000, height: 1000 });
    expect(scaledDimensions(1000, 5000, 2000)).toEqual({ width: 400, height: 2000 });
  });
});

describe('effectiveLadder', () => {
  it('never upscales beyond the original long edge', () => {
    const ladder = effectiveLadder(1500, 1000);
    for (const step of ladder) {
      expect(step.maxEdge).toBeLessThanOrEqual(1500);
    }
  });

  it('keeps descending edges for large images', () => {
    const ladder = effectiveLadder(6000, 4000);
    expect(ladder[0]).toEqual({ maxEdge: 2000, quality: 0.84 });
    expect(ladder[ladder.length - 1].maxEdge).toBe(1280);
  });
});
