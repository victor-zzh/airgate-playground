import type { ImageSizeSettings } from './types';

export const STUDIO_MODE_STORAGE_KEY = 'airgate.playground.studioMode';
export const CANVAS_MODE_STORAGE_KEY = 'airgate.playground.canvasMode';
export const THINKING_VISIBLE_STORAGE_KEY = 'airgate.playground.thinkingVisible';
export const CANVAS_CONVERSATION_STORAGE_KEY = 'airgate.playground.canvasConversationId';
export const CANVAS_CONVERSATION_TITLE_PREFIX = '🎨 ';
export const IMAGE_STUDIO_ENABLED = false;

export const MOBILE_BREAKPOINT = 960;
export const DRAFT_CONVERSATION_ID = -1;
export const BASE64_DATA_URL_RE = /data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+/g;
const MARKDOWN_IMAGE_URL_PATTERN = String.raw`data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+|\/api\/v1\/ext-user\/airgate-playground\/assets\/[^\s)]+|\/assets-runtime\/[^\s)]+|blob:[^\s)]+`;
export const IMAGE_MARKDOWN_RE = new RegExp(String.raw`!\[[^\]]*\]\((${MARKDOWN_IMAGE_URL_PATTERN})\)`, 'g');
export const IMAGE_MARKDOWN_ITEM_RE = new RegExp(String.raw`!\[([^\]]*)\]\((${MARKDOWN_IMAGE_URL_PATTERN})\)`, 'g');
export const IMAGE_EDIT_ANNOTATION_RE = /<!--airgate:image-edit:([A-Za-z0-9+/=]+)-->/g;
export const DATA_IMAGE_RE = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MIN_SELECTION_SIZE = 8;
export const GPT_IMAGE_MAX_SIDE = 3840;
export const GPT_IMAGE_MIN_PIXELS = 655360;
export const GPT_IMAGE_MAX_PIXELS = 8294400;
export const DEFAULT_MODEL_ID = 'gpt-5.5';
export const ACTIVE_CONVERSATION_STORAGE_KEY = 'airgate.playground.activeConversationId';
export const SELECTED_MODEL_STORAGE_KEY = 'airgate.playground.selectedModel';
export const IMAGE_SIZE_AUTO = 'auto';
export const IMAGE_SIZE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: IMAGE_SIZE_AUTO, label: 'Auto' },
  { value: '1024x1024', label: '1024×1024 (1K)' },
  { value: '1536x1024', label: '1536×1024 (1K)' },
  { value: '1024x1536', label: '1024×1536 (1K)' },
  { value: '2048x2048', label: '2048×2048 (2K)' },
  { value: '2048x1152', label: '2048×1152 (2K)' },
  { value: '1152x2048', label: '1152×2048 (2K)' },
  { value: '3840x2160', label: '3840×2160 (4K)' },
  { value: '2160x3840', label: '2160×3840 (4K)' },
];
export const DEFAULT_IMAGE_SIZE_SETTINGS: ImageSizeSettings = {
  value: IMAGE_SIZE_AUTO,
};
