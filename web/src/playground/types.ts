import type { ChatMessageContent, Conversation, ImageEditResponse, ImageTask, Message, ModelInfo, PlatformInfo, ReasoningEffort, UserInfo } from '../api';

// Re-export API types for convenience
export type { ChatMessageContent, Conversation, ImageEditResponse, ImageTask, Message, ModelInfo, PlatformInfo, ReasoningEffort, UserInfo };

export type ImageSizeSettings = {
  value: string;
};
export type SelectOption = { value: string; label: string };
export type PendingImage = { id: string; name: string; url: string; file?: File };
export type EditImage = PendingImage & { file: File };
export type EditSelectionRect = { x: number; y: number; width: number; height: number };
export type ConfirmedImageEdit = { source: EditImage; selection: EditSelectionRect; sourceWidth: number; sourceHeight: number };
export type ImageEditAnnotation = { imageIndex: number; rect: EditSelectionRect };
export type PreviewImage = { url: string; alt: string };
export type CanvasImage = PreviewImage & { messageId: number; messageIndex: number; imageIndex: number; prompt: string; model?: string };
export type CanvasWorkflowNode = {
  id: string;
  prompt: string;
  createdAt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  images: CanvasImage[];
  assistantText: string;
  model?: string;
  errorMessage?: string;
};
export type ImagePreviewState = { images: PreviewImage[]; index: number };
export type StreamAssistantOptions = {
  conversationID: number;
  requestMessages: Message[];
  model: string;
  groupID: number;
  platform: string;
  isImageRequest?: boolean;
  imageSize?: string;
  supportsReasoning?: boolean;
  reasoningEffort?: ReasoningEffort;
  titleContent?: string;
};
export type RetryRequest = Omit<StreamAssistantOptions, 'titleContent'>;
export type MessageContentOptions = {
  onImagePreview?: (url: string, alt: string, imageIndex: number) => void;
  imagePreviewTitle?: string;
  generatedImageAlt?: string;
  imageEditAnnotations?: ImageEditAnnotation[];
  imageActions?: (image: PreviewImage, imageIndex: number) => import('react').ReactNode;
  takeImageIndex?: () => number;
  trailingInlineAction?: import('react').ReactNode;
  isMobile?: boolean;
};
export type BlobUrlRegistry = Map<string, string>;
