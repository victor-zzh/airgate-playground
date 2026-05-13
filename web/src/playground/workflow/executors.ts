import type { NodeResult, NodeExecutor, ExecutionContext, WorkflowNodeData } from './types';
import { api } from '../../api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Wait for `ms` milliseconds, but resolve early if the signal is aborted. */
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Parse `![alt](url)` markdown image syntax and return an array of {url, alt}. */
function parseMarkdownImages(text: string): Array<{ url: string; alt: string }> {
  const regex = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
  const results: Array<{ url: string; alt: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    results.push({ alt: match[1], url: match[2] });
  }
  return results;
}

/**
 * Poll an image task until it reaches a terminal state.
 * Polls every 2 seconds for up to `maxAttempts` iterations.
 */
async function pollImageTask(
  taskId: number,
  signal: AbortSignal,
  maxAttempts = 120,
): Promise<import('../../api').ImageTask> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const task = await api.getImageTask(taskId);

    if (task.status === 'completed') return task;
    if (task.status === 'failed') {
      throw new Error(task.error_message || 'Image generation task failed');
    }

    // Still pending / processing — wait before the next poll
    await delay(2000, signal);
  }

  throw new Error('Image generation timed out after waiting too long');
}

/**
 * Load an HTMLImageElement from a URL, resolving when fully loaded.
 * Requires a browser environment with CORS headers on the image host,
 * or the URL must be a local blob: / data: URL.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Convert a canvas to a blob URL.
 * The caller is responsible for revoking the URL when it is no longer needed.
 */
function canvasToBlobUrl(canvas: HTMLCanvasElement, type = 'image/png'): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Failed to convert canvas to blob'));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, type);
  });
}

// ─── Core image-generation logic (shared by image_generate & batch_generate) ─

async function generateSingleImage(
  prompt: string,
  size: string,
  context: ExecutionContext,
): Promise<Array<{ url: string; alt: string }>> {
  const task = await api.createImageTask({
    conversation_id: context.conversationId,
    platform: context.platform,
    model: context.model,
    prompt,
    image_size: size || undefined,
    group_id: context.groupId,
  });

  await pollImageTask(task.id, context.signal);

  // Fetch messages from the conversation to extract image URLs
  const messages = await api.listMessages(context.conversationId);

  // Find the last assistant message and parse markdown images from it
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
  if (!lastAssistant) {
    throw new Error('No assistant message found after image generation');
  }

  const images = parseMarkdownImages(lastAssistant.content);
  if (images.length === 0) {
    throw new Error('No images found in the assistant response');
  }

  return images;
}

// ─── Executor implementations ─────────────────────────────────────────────────

async function textInputExecutor(
  _inputs: Record<string, NodeResult>,
  data: WorkflowNodeData,
  _context: ExecutionContext,
): Promise<NodeResult> {
  return { text: (data.values.text as string) ?? '' };
}

async function imageReferenceExecutor(
  _inputs: Record<string, NodeResult>,
  data: WorkflowNodeData,
  _context: ExecutionContext,
): Promise<NodeResult> {
  const url = data.values.url as string | undefined;
  if (!url) throw new Error('Image Reference: URL is required');

  return {
    images: [
      {
        url,
        alt: (data.values.alt as string) ?? '',
      },
    ],
  };
}

async function imageGenerateExecutor(
  inputs: Record<string, NodeResult>,
  data: WorkflowNodeData,
  context: ExecutionContext,
): Promise<NodeResult> {
  const prompt =
    (inputs['prompt']?.text as string | undefined) ||
    (data.values.prompt as string | undefined);

  if (!prompt) throw new Error('Image Generate: a prompt is required');

  const size =
    (inputs['size']?.text as string | undefined) ||
    (data.values.size as string | undefined) ||
    context.imageSize ||
    'auto';

  const images = await generateSingleImage(prompt, size, context);
  return { images };
}

async function imageEditExecutor(
  inputs: Record<string, NodeResult>,
  data: WorkflowNodeData,
  context: ExecutionContext,
): Promise<NodeResult> {
  const sourceUrl =
    (inputs['image']?.images?.[0]?.url as string | undefined) ||
    (data.values.sourceUrl as string | undefined);

  if (!sourceUrl) throw new Error('Image Edit: a source image is required');

  const prompt =
    (inputs['prompt']?.text as string | undefined) ||
    (data.values.prompt as string | undefined);

  if (!prompt) throw new Error('Image Edit: a prompt is required');

  // Attempt to use the native image-edit API (multipart/form-data).
  // We fetch the source image first so we can send it as a File blob.
  try {
    const { editImage } = await import('../../api');

    const imageResp = await fetch(sourceUrl);
    if (!imageResp.ok) throw new Error('Could not fetch source image for editing');
    const imageBlob = await imageResp.blob();
    const imageFile = new File([imageBlob], 'source.png', { type: imageBlob.type || 'image/png' });

    const form = new FormData();
    form.append('image', imageFile);
    form.append('prompt', prompt);
    form.append('model', context.model);
    if (context.imageSize) form.append('size', context.imageSize);

    const editResponse = await editImage(context.platform, form, context.signal);

    const resultUrl = editResponse.data?.[0]?.url;
    if (!resultUrl) throw new Error('Image edit API returned no image URL');

    return { images: [{ url: resultUrl, alt: 'Edited image' }] };
  } catch (editErr) {
    // Fall back to text-based generation: incorporate the source image URL
    // into the prompt and run a normal generation task.
    const fallbackPrompt = `${prompt}\n\nReference image: ${sourceUrl}`;
    const size =
      (data.values.size as string | undefined) ||
      context.imageSize ||
      'auto';
    const images = await generateSingleImage(fallbackPrompt, size, context);
    return { images };
  }
}

async function conditionalExecutor(
  inputs: Record<string, NodeResult>,
  data: WorkflowNodeData,
  _context: ExecutionContext,
): Promise<NodeResult> {
  const conditionText =
    (inputs['condition']?.text as string | undefined) ||
    (data.values.match as string | undefined) ||
    '';

  const input = inputs['input'];
  const inputText = input?.text ?? '';
  const expression = (data.values.expression as string | undefined) ?? 'contains';
  const matchValue = (data.values.match as string | undefined) ?? '';

  let result = false;

  switch (expression) {
    case 'contains':
      result = inputText.includes(matchValue);
      break;

    case 'equals':
      result = inputText === matchValue;
      break;

    case 'regex': {
      try {
        const re = new RegExp(matchValue);
        result = re.test(inputText);
      } catch {
        throw new Error(`Conditional: invalid regex "${matchValue}"`);
      }
      break;
    }

    default:
      // Unknown expression — treat as a simple truthiness check on the condition input
      result = Boolean(conditionText);
  }

  // Pass the input through so downstream nodes on the taken branch receive it
  return {
    boolean: result,
    ...(input ? { text: input.text, images: input.images, number: input.number } : {}),
  };
}

async function batchGenerateExecutor(
  inputs: Record<string, NodeResult>,
  data: WorkflowNodeData,
  context: ExecutionContext,
): Promise<NodeResult> {
  const prompt =
    (inputs['prompt']?.text as string | undefined) ||
    (data.values.prompt as string | undefined);

  if (!prompt) throw new Error('Batch Generate: a prompt is required');

  const count =
    (inputs['count']?.number as number | undefined) ||
    (data.values.count as number | undefined) ||
    4;

  const size =
    (inputs['size']?.text as string | undefined) ||
    (data.values.size as string | undefined) ||
    context.imageSize ||
    'auto';

  // Run all generation tasks in parallel
  const tasks = Array.from({ length: count }, () =>
    generateSingleImage(prompt, size, context),
  );

  const settled = await Promise.allSettled(tasks);

  const allImages: Array<{ url: string; alt: string }> = [];
  const errors: string[] = [];

  for (const outcome of settled) {
    if (outcome.status === 'fulfilled') {
      allImages.push(...outcome.value);
    } else {
      errors.push(outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason));
    }
  }

  if (allImages.length === 0) {
    throw new Error(`Batch Generate: all tasks failed. Errors: ${errors.join('; ')}`);
  }

  return { images: allImages };
}

async function resizeExecutor(
  inputs: Record<string, NodeResult>,
  data: WorkflowNodeData,
  _context: ExecutionContext,
): Promise<NodeResult> {
  const url = inputs['image']?.images?.[0]?.url;
  if (!url) throw new Error('Resize: no input image provided');

  const targetWidth =
    (inputs['width']?.number as number | undefined) ||
    (data.values.width as number | undefined) ||
    1024;

  const targetHeight =
    (inputs['height']?.number as number | undefined) ||
    (data.values.height as number | undefined) ||
    1024;

  const img = await loadImage(url);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Resize: could not get canvas 2D context');

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blobUrl = await canvasToBlobUrl(canvas);
  return { images: [{ url: blobUrl, alt: 'Resized image' }] };
}

async function mergeExecutor(
  inputs: Record<string, NodeResult>,
  data: WorkflowNodeData,
  _context: ExecutionContext,
): Promise<NodeResult> {
  const urlA = inputs['image_a']?.images?.[0]?.url;
  const urlB = inputs['image_b']?.images?.[0]?.url;

  if (!urlA) throw new Error('Merge: Image A is required');
  if (!urlB) throw new Error('Merge: Image B is required');

  const layout =
    (inputs['layout']?.text as string | undefined) ||
    (data.values.layout as string | undefined) ||
    'horizontal';

  const [imgA, imgB] = await Promise.all([loadImage(urlA), loadImage(urlB)]);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Merge: could not get canvas 2D context');

  switch (layout) {
    case 'vertical':
      canvas.width = Math.max(imgA.naturalWidth, imgB.naturalWidth);
      canvas.height = imgA.naturalHeight + imgB.naturalHeight;
      ctx.drawImage(imgA, 0, 0);
      ctx.drawImage(imgB, 0, imgA.naturalHeight);
      break;

    case 'overlay':
      canvas.width = Math.max(imgA.naturalWidth, imgB.naturalWidth);
      canvas.height = Math.max(imgA.naturalHeight, imgB.naturalHeight);
      ctx.drawImage(imgA, 0, 0);
      ctx.globalAlpha = 0.5;
      ctx.drawImage(imgB, 0, 0);
      ctx.globalAlpha = 1.0;
      break;

    case 'horizontal':
    default:
      canvas.width = imgA.naturalWidth + imgB.naturalWidth;
      canvas.height = Math.max(imgA.naturalHeight, imgB.naturalHeight);
      ctx.drawImage(imgA, 0, 0);
      ctx.drawImage(imgB, imgA.naturalWidth, 0);
      break;
  }

  const blobUrl = await canvasToBlobUrl(canvas);
  return { images: [{ url: blobUrl, alt: 'Merged image' }] };
}

// ─── Public executor map ──────────────────────────────────────────────────────

export const EXECUTORS: Record<string, NodeExecutor> = {
  text_input: textInputExecutor,
  image_reference: imageReferenceExecutor,
  image_generate: imageGenerateExecutor,
  image_edit: imageEditExecutor,
  conditional: conditionalExecutor,
  batch_generate: batchGenerateExecutor,
  resize: resizeExecutor,
  merge: mergeExecutor,
};
