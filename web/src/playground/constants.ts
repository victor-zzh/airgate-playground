export const MOBILE_BREAKPOINT = 960;
export const DRAFT_CONVERSATION_ID = -1;

export const DEFAULT_MODEL_ID = 'gpt-5.5';
export const ACTIVE_CONVERSATION_STORAGE_KEY = 'airgate.playground.activeConversationId';
export const SELECTED_MODEL_STORAGE_KEY = 'airgate.playground.selectedModel';
export const THINKING_VISIBLE_STORAGE_KEY = 'airgate.playground.thinkingVisible';

export const BASE64_DATA_URL_RE = /data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+/g;
const MARKDOWN_IMAGE_URL_PATTERN = String.raw`data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+|\/api\/v1\/ext-user\/airgate-playground\/assets\/[^\s)]+|\/assets-runtime\/[^\s)]+|blob:[^\s)]+`;
export const IMAGE_MARKDOWN_RE = new RegExp(String.raw`!\[[^\]]*\]\((${MARKDOWN_IMAGE_URL_PATTERN})\)`, 'g');
export const IMAGE_MARKDOWN_ITEM_RE = new RegExp(String.raw`!\[([^\]]*)\]\((${MARKDOWN_IMAGE_URL_PATTERN})\)`, 'g');
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_FILE_BYTES = 512 * 1024;
