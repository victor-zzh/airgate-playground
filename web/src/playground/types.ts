import type { ChatMessageContent, Conversation, Message, ReasoningEffort, UserInfo } from '../api';

export type { ChatMessageContent, Conversation, Message, ReasoningEffort, UserInfo };

export type SelectOption = { value: string; label: string };
export type PendingImage = {
  id: string;
  name: string;
  url: string;
  originalBytes?: number;
  finalBytes?: number;
  compressed?: boolean;
  mediaKind?: 'image' | 'video';
  warningText?: string;
};
export type PendingFile = {
  id: string;
  name: string;
  content: string;
  size: number;
  type: string;
  truncated?: boolean;
  warningText?: string;
};
export type PreviewImage = { url: string; alt: string };
export type ImagePreviewState = { images: PreviewImage[]; index: number };
export type BlobUrlRegistry = Map<string, string>;

export interface ModelInfo {
  id: string;
  name: string;
  platform: string;
  input_price: number;
  output_price: number;
  context_window: number;
  max_output_tokens: number;
  capabilities: string[];
}

export type StreamAssistantOptions = {
  conversationID: number;
  requestMessages: Message[];
  model: string;
  groupID: number;
  platform: string;
  supportsReasoning?: boolean;
  reasoningEffort?: ReasoningEffort;
  titleContent?: string;
};

export type RetryRequest = Omit<StreamAssistantOptions, 'titleContent'>;

export type MessageContentOptions = {
  onImagePreview?: (url: string, alt: string, imageIndex: number) => void;
  imagePreviewTitle?: string;
  generatedImageAlt?: string;
  takeImageIndex?: () => number;
  trailingInlineAction?: import('react').ReactNode;
  isMobile?: boolean;
  // 仅用户消息为 true：把 <file> 块折叠成 chip。助手输出里的同形文本（如代码示例）按普通 markdown 渲染。
  parseFileBlocks?: boolean;
};
