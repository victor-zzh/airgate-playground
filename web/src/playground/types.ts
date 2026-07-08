import type { ChatMessageContent, Conversation, Message, ReasoningEffort, UserInfo } from '../api';

export type { ChatMessageContent, Conversation, Message, ReasoningEffort, UserInfo };

export type SelectOption = { value: string; label: string };
export type PendingImage = { id: string; name: string; url: string; file?: File };
export type PendingFile = { id: string; name: string; content: string; size: number; type: string };
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
};
