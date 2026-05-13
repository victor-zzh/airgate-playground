import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { api, chatCompletionsStream } from '../api';
import type {
  BlobUrlRegistry,
  CanvasImage,
  CanvasWorkflowNode,
  ConfirmedImageEdit,
  EditImage,
  EditSelectionRect,
  ImagePreviewState,
  ImageSizeSettings,
  MessageContentOptions,
  PendingImage,
  PreviewImage,
  RetryRequest,
  SelectOption,
  StreamAssistantOptions,
  Conversation,
  GenerationTask,
  Message,
  ModelInfo,
  PlatformInfo,
  ReasoningEffort,
  UserInfo,
} from './types';
import {
  ACTIVE_CONVERSATION_STORAGE_KEY,
  CANVAS_CONVERSATION_STORAGE_KEY,
  CANVAS_CONVERSATION_TITLE_PREFIX,
  CANVAS_MODE_STORAGE_KEY,
  DEFAULT_IMAGE_SIZE_SETTINGS,
  DRAFT_CONVERSATION_ID,
  MOBILE_BREAKPOINT,
  SELECTED_MODEL_STORAGE_KEY,
  STUDIO_MODE_STORAGE_KEY,
  THINKING_VISIBLE_STORAGE_KEY,
} from './constants';
import {
  canvasToBlob,
  clampNumber,
  copyableMessageText,
  copyText,
  defaultModelOptionValue,
  downloadImage,
  editImageFromFile,
  editImageFromUrl,
  generatedImages,
  getStoredActiveConversationId,
  getStoredSelectedModel,
  hasCopyableMessageText,
  imagesFromFiles,
  isImageModel,
  isUsableSelection,
  loadImageElement,
  messageContentWithImages,
  modelOptionValue,
  parseImageEditAnnotations,
  fileToDataURL,
  readLocalStorageValue,
  replaceBase64WithBlobUrls,
  replaceBlobUrlsWithBase64,
  resolveImageSize,
  revokeBlobRegistry,
  selectionRectFromPoints,
  sourceAlignedImageSize,
  stripImageEditAnnotations,
  stripImageMarkdown,
  stripImagePlannerNoise,
  supportsReasoning,
  titleFromMessageContent,
  toChatMessageContent,
  writeLocalStorageValue,
} from './utils';
import { styles } from './styles';
import { renderMessageContent } from './MessageRendering';

declare global {
  interface Window {
    airgate?: {
      confirm?: (message: string, options?: { title?: string; danger?: boolean }) => Promise<boolean>;
    };
  }
}

function blobToDataURL(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('读取图片失败'));
    reader.readAsDataURL(blob);
  });
}

// ---------------------------------------------------------------------------
// Context type — lists ALL values shared between ChatView and CanvasView
// ---------------------------------------------------------------------------

export interface PlaygroundContextValue {
  t: (key: string, options?: Record<string, unknown>) => string;

  // Conversations
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  conversationsLoaded: boolean;
  activeId: number | null;
  setActiveId: React.Dispatch<React.SetStateAction<number | null>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setMessagesRaw: React.Dispatch<React.SetStateAction<Message[]>>;

  // Streaming
  isStreaming: boolean;
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  streamContent: string;
  setStreamContent: React.Dispatch<React.SetStateAction<string>>;
  streamReasoning: string;
  setStreamReasoning: React.Dispatch<React.SetStateAction<string>>;
  streamConversationId: number | null;
  setStreamConversationId: React.Dispatch<React.SetStateAction<number | null>>;

  // Model & platform
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  platforms: PlatformInfo[];
  models: ModelInfo[];
  selectedModelInfo: ModelInfo | undefined;
  selectedModelID: string;
  selectedPlatform: string;
  selectedModelIsImage: boolean;
  selectedModelSupportsReasoning: boolean;
  resolvedImageSize: string | undefined;
  modelOptions: SelectOption[];
  chatModelOptions: SelectOption[];
  imageModelOptions: SelectOption[];
  platformNameById: Map<string, string>;

  // Input
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  pendingImages: PendingImage[];
  setPendingImages: React.Dispatch<React.SetStateAction<PendingImage[]>>;

  // Edit panel
  editSource: EditImage | null;
  setEditSource: React.Dispatch<React.SetStateAction<EditImage | null>>;
  confirmedImageEdit: ConfirmedImageEdit | null;
  setConfirmedImageEdit: React.Dispatch<React.SetStateAction<ConfirmedImageEdit | null>>;
  isEditPanelOpen: boolean;
  setIsEditPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isEditingImage: boolean;
  setIsEditingImage: React.Dispatch<React.SetStateAction<boolean>>;
  editSelection: EditSelectionRect | null;
  setEditSelection: React.Dispatch<React.SetStateAction<EditSelectionRect | null>>;
  draftEditSelection: EditSelectionRect | null;
  setDraftEditSelection: React.Dispatch<React.SetStateAction<EditSelectionRect | null>>;
  editStageSize: { width: number; height: number } | null;
  setEditStageSize: React.Dispatch<React.SetStateAction<{ width: number; height: number } | null>>;

  // Errors & notices
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  retryRequest: RetryRequest | null;
  setRetryRequest: React.Dispatch<React.SetStateAction<RetryRequest | null>>;
  interactionNotice: string;
  setInteractionNotice: React.Dispatch<React.SetStateAction<string>>;
  previewImage: ImagePreviewState | null;
  setPreviewImage: React.Dispatch<React.SetStateAction<ImagePreviewState | null>>;
  regeneratingImage: { messageID: number; imageIndex: number } | null;
  setRegeneratingImage: React.Dispatch<React.SetStateAction<{ messageID: number; imageIndex: number } | null>>;

  // User & settings
  userInfo: UserInfo | null;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  reasoningEffort: ReasoningEffort;
  setReasoningEffort: React.Dispatch<React.SetStateAction<ReasoningEffort>>;
  thinkingVisible: boolean;
  setThinkingVisible: React.Dispatch<React.SetStateAction<boolean>>;
  imageSizeSettings: ImageSizeSettings;
  openSelectId: string | null;
  setOpenSelectId: React.Dispatch<React.SetStateAction<string | null>>;

  // Layout
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  canvasMode: boolean;
  setCanvasMode: React.Dispatch<React.SetStateAction<boolean>>;
  studioMode: boolean;
  setStudioMode: React.Dispatch<React.SetStateAction<boolean>>;

  // Hover
  hoveredCopyTarget: string | null;
  setHoveredCopyTarget: React.Dispatch<React.SetStateAction<string | null>>;

  // Refs
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  editFileInputRef: React.RefObject<HTMLInputElement | null>;
  messagesAreaRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  abortRef: React.MutableRefObject<AbortController | null>;
  activeIdRef: React.MutableRefObject<number | null>;
  streamContextRef: React.MutableRefObject<{ conversationId: number; model: string } | null>;
  blobUrlRegistryRef: React.MutableRefObject<BlobUrlRegistry>;
  pendingRefocusRef: React.MutableRefObject<boolean>;
  skipNextMessagesLoadRef: React.MutableRefObject<number | null>;
  chatActiveIdRef: React.MutableRefObject<number | null>;
  editCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  editCanvasContainerRef: React.RefObject<HTMLDivElement | null>;
  selectionStartRef: React.MutableRefObject<{ x: number; y: number } | null>;
  submitRef: React.MutableRefObject<(() => void) | null>;

  // Canvas
  canvasTaskStatus: 'idle' | 'pending' | 'processing';
  canvasTasks: GenerationTask[];
  setCanvasTasks: React.Dispatch<React.SetStateAction<GenerationTask[]>>;
  expandedPromptNodeId: string | null;
  setExpandedPromptNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  canvasZoom: number;
  setCanvasZoom: React.Dispatch<React.SetStateAction<number>>;
  canvasPan: { x: number; y: number };
  setCanvasPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  canvasPanningRef: React.MutableRefObject<{ startX: number; startY: number; panX: number; panY: number } | null>;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;

  // Computed
  sidebarConversations: Conversation[];
  canvasConversations: Conversation[];
  activeConv: Conversation | undefined;
  isActiveConversationStreaming: boolean;
  canSendMessage: boolean;
  lastMessage: Message | undefined;
  hasRecoverableUserMessage: boolean;
  canvasWorkflowNodes: CanvasWorkflowNode[];
  allConversationImages: CanvasImage[];
  interactiveMessageOptions: MessageContentOptions;

  // Callbacks
  resolveGroupID: () => number;
  updateImageSizeSettings: (patch: Partial<ImageSizeSettings>) => void;
  createConversation: () => void;
  createCanvasConversation: () => void;
  openCanvasConversation: (id: number) => void;
  deleteConversation: (id: number) => Promise<void>;
  streamAssistantResponse: (options: StreamAssistantOptions) => Promise<void>;
  sendMessage: () => Promise<void>;
  sendCanvasMessage: () => Promise<void>;
  pollGenerationTask: (taskId: number, conversationID: number) => Promise<GenerationTask | undefined>;
  regenerateCanvasNode: (node: CanvasWorkflowNode) => Promise<void>;
  addImageFiles: (files: File[]) => Promise<void>;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleEditImageChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  selectEditImage: (file?: File) => Promise<void>;
  editGeneratedImage: (url: string, alt: string, sourceModel?: string, sourcePlatform?: string) => Promise<void>;
  triggerImagePicker: () => void;
  triggerEditImagePicker: () => void;
  openPendingImageForEdit: (image: PendingImage) => Promise<void>;
  clearEditSelection: () => void;
  cancelEditPanel: () => void;
  confirmEditSelection: () => Promise<void>;
  submitImageEdit: () => Promise<void>;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  removePendingImage: (id: string) => void;
  stopStreaming: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  autoResize: (el: HTMLTextAreaElement) => void;
  handleImagePreview: (url: string, alt: string, imageIndex?: number) => void;
  handleImageDownload: (url: string, alt: string) => void;
  showImagePreview: (images: PreviewImage[], index: number) => void;
  showNextPreviewImage: (direction: -1 | 1) => void;
  regenerateLastResponse: () => void;
  regenerateUnfinishedResponse: () => void;
  regenerateImage: (messageIndex: number, imageIndex: number) => void;
  handleMessageCopy: (content: string) => void;
  openConversation: (id: number) => void;
  handleCanvasWheel: (e: React.WheelEvent) => void;
  handleCanvasPanStart: (e: React.PointerEvent) => void;
  handleCanvasPanMove: (e: React.PointerEvent) => void;
  handleCanvasPanEnd: () => void;
  resetCanvasView: () => void;
  selectionPointFromEvent: (event: React.PointerEvent<HTMLCanvasElement>) => { x: number; y: number } | null;
  handleSelectionPointerDown: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  handleSelectionPointerMove: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  finishSelectionDrag: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  createEditMaskBlob: (edit: ConfirmedImageEdit) => Promise<Blob>;

  // Rendering helpers
  renderCustomSelect: (props: {
    id: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    ariaLabel: string;
    variant?: 'model' | 'chip';
    alignRight?: boolean;
  }) => ReactNode;

  // Derived scalars
  visibleEditSelection: EditSelectionRect | null;
  isEditSelectionConfirmable: boolean;
}

// ---------------------------------------------------------------------------
// Context + hook
// ---------------------------------------------------------------------------

const PlaygroundContext = createContext<PlaygroundContextValue | null>(null);

export function usePlayground() {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) throw new Error('usePlayground must be used within PlaygroundProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider — contains the entire component body from PlaygroundPage
// (all state, refs, effects, memos, callbacks) except the JSX return.
// ---------------------------------------------------------------------------

export function PlaygroundProvider({ children, initialCanvasMode }: { children: ReactNode; initialCanvasMode?: boolean }) {
  const { t } = useTranslation();

  // ── useState ──────────────────────────────────────────────────────────

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessagesRaw] = useState<Message[]>([]);
  const [streamConversationId, setStreamConversationId] = useState<number | null>(null);
  const [streamContent, setStreamContent] = useState('');
  const [streamReasoning, setStreamReasoning] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [canvasTaskStatus, setCanvasTaskStatus] = useState<'idle' | 'pending' | 'processing'>('idle');
  const [canvasTasks, setCanvasTasks] = useState<GenerationTask[]>([]);
  const [expandedPromptNodeId, setExpandedPromptNodeId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [editSource, setEditSource] = useState<EditImage | null>(null);
  const [confirmedImageEdit, setConfirmedImageEdit] = useState<ConfirmedImageEdit | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editSelection, setEditSelection] = useState<EditSelectionRect | null>(null);
  const [draftEditSelection, setDraftEditSelection] = useState<EditSelectionRect | null>(null);
  const [editStageSize, setEditStageSize] = useState<{ width: number; height: number } | null>(null);
  const [previewImage, setPreviewImage] = useState<ImagePreviewState | null>(null);

  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [openSelectId, setOpenSelectId] = useState<string | null>(null);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>('medium');
  const [thinkingVisible, setThinkingVisible] = useState(() => {
    return readLocalStorageValue(THINKING_VISIBLE_STORAGE_KEY) !== '0';
  });
  const [imageSizeSettings, setImageSizeSettings] = useState<ImageSizeSettings>(() => ({ ...DEFAULT_IMAGE_SIZE_SETTINGS }));
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState('');
  const [retryRequest, setRetryRequest] = useState<RetryRequest | null>(null);
  const [regeneratingImage, setRegeneratingImage] = useState<{ messageID: number; imageIndex: number } | null>(null);
  const [interactionNotice, setInteractionNotice] = useState('');
  const [hoveredCopyTarget, setHoveredCopyTarget] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false
  ));
  const [studioMode, setStudioMode] = useState(() => {
    return readLocalStorageValue(STUDIO_MODE_STORAGE_KEY) === '1';
  });
  const [canvasMode, setCanvasMode] = useState(() => {
    return initialCanvasMode ?? readLocalStorageValue(CANVAS_MODE_STORAGE_KEY) === '1';
  });

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });

  // ── useRef ────────────────────────────────────────────────────────────

  const chatActiveIdRef = useRef<number | null>(null);
  const canvasPanningRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const editCanvasContainerRef = useRef<HTMLDivElement>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const activeIdRef = useRef<number | null>(null);
  const streamContextRef = useRef<{ conversationId: number; model: string } | null>(null);
  const skipNextMessagesLoadRef = useRef<number | null>(null);
  const pendingRefocusRef = useRef(false);
  const blobUrlRegistryRef = useRef<BlobUrlRegistry>(new Map());
  const submitRef = useRef<(() => void) | null>(null);

  // ── setMessages wrapper (base64 -> blob URL) ─────────────────────────

  const setMessages = useCallback<typeof setMessagesRaw>((arg) => {
    const transform = (msgs: Message[]) =>
      msgs.map(msg => {
        if (!msg.content || !msg.content.includes('data:image/')) return msg;
        return { ...msg, content: replaceBase64WithBlobUrls(msg.content, blobUrlRegistryRef.current) };
      });
    if (typeof arg === 'function') {
      setMessagesRaw(prev => transform(arg(prev)));
    } else {
      setMessagesRaw(transform(arg));
    }
  }, []);

  // ── useEffect hooks ───────────────────────────────────────────────────

  // Persist studio / canvas mode to localStorage
  useEffect(() => {
    writeLocalStorageValue(STUDIO_MODE_STORAGE_KEY, studioMode ? '1' : null);
  }, [studioMode]);
  useEffect(() => {
    writeLocalStorageValue(CANVAS_MODE_STORAGE_KEY, canvasMode ? '1' : null);
  }, [canvasMode]);
  useEffect(() => {
    writeLocalStorageValue(THINKING_VISIBLE_STORAGE_KEY, thinkingVisible ? null : '0');
  }, [thinkingVisible]);

  // Refocus input after streaming ends
  useEffect(() => {
    if (!isStreaming && !isEditingImage && pendingRefocusRef.current) {
      pendingRefocusRef.current = false;
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isStreaming, isEditingImage]);

  // Initial data loading
  useEffect(() => {
    api.listConversations().then(nextConversations => {
      setConversations(nextConversations);
      setConversationsLoaded(true);
      const storedActiveId = getStoredActiveConversationId();
      if (storedActiveId && nextConversations.some(item => item.id === storedActiveId)) {
        setActiveId(storedActiveId);
      } else {
        writeLocalStorageValue(ACTIVE_CONVERSATION_STORAGE_KEY, null);
      }
    }).catch(() => {});
    api.getUserInfo().then(setUserInfo).catch(() => {});
    let cancelled = false;
    api.listPlatforms().then(async nextPlatforms => {
      if (cancelled) return;
      setPlatforms(nextPlatforms);
      const modelLists = await Promise.all(nextPlatforms.map(platform => api.listModels(platform.name).catch(() => [])));
      if (cancelled) return;
      const nextModels = modelLists.flat();
      const storedModel = getStoredSelectedModel();
      setModels(nextModels);
      setSelectedModel(current => {
        const existingValue = current || storedModel;
        return nextModels.some(item => modelOptionValue(item) === existingValue) ? existingValue : defaultModelOptionValue(nextModels);
      });
    }).catch(e => {
      if (cancelled) return;
      setModels([]);
      setSelectedModel('');
      setRetryRequest(null);
      setError(e instanceof Error ? e.message : 'Failed to load models');
    });
    return () => { cancelled = true; };
  }, []);

  // ── Derived model values (need to be declared before effects that use them) ──

  const selectedModelInfo = useMemo(
    () => models.find(item => modelOptionValue(item) === selectedModel),
    [models, selectedModel],
  );
  const selectedModelID = selectedModelInfo?.id || '';
  const selectedModelPlatform = selectedModelInfo?.platform || '';
  const selectedModelIsImage = isImageModel(selectedModelInfo);
  const selectedModelSupportsReasoning = supportsReasoning(selectedModelInfo);
  const resolvedImageSize = useMemo(() => resolveImageSize(imageSizeSettings), [imageSizeSettings.value]);

  const selectedPlatform = selectedModelPlatform;
  const platformNameById = useMemo(
    () => new Map(platforms.map(item => [item.name, item.display_name || item.name])),
    [platforms],
  );
  const toSelectOption = useCallback((model: ModelInfo) => ({
    value: modelOptionValue(model),
    label: `${model.name || model.id} · ${platformNameById.get(model.platform || '') || model.platform || ''}`,
  }), [platformNameById]);

  const modelOptions = useMemo(
    () => models.map(toSelectOption),
    [models, toSelectOption],
  );

  const chatModelOptions = useMemo(
    () => models.filter(m => !isImageModel(m)).map(toSelectOption),
    [models, toSelectOption],
  );

  const imageModelOptions = useMemo(
    () => models.filter(isImageModel).map(toSelectOption),
    [models, toSelectOption],
  );

  // ── resolveGroupID & updateImageSizeSettings ──────────────────────────

  const resolveGroupID = useCallback(() => 0, []);

  const updateImageSizeSettings = useCallback((patch: Partial<ImageSizeSettings>) => {
    setImageSizeSettings(current => ({ ...current, ...patch }));
  }, []);

  // ── Canvas mode switching effect ──────────────────────────────────────

  useEffect(() => {
    if (!conversationsLoaded) return;
    if (canvasMode) {
      chatActiveIdRef.current = activeId;
      if (!selectedModelIsImage && imageModelOptions.length > 0) {
        setSelectedModel(imageModelOptions[0].value);
      }
      const storedCanvasId = Number(readLocalStorageValue(CANVAS_CONVERSATION_STORAGE_KEY));
      if (storedCanvasId && conversations.some(c => c.id === storedCanvasId && c.title.startsWith(CANVAS_CONVERSATION_TITLE_PREFIX))) {
        setActiveId(storedCanvasId);
      } else {
        writeLocalStorageValue(CANVAS_CONVERSATION_STORAGE_KEY, null);
        const existingCanvas = conversations.find(c => c.title.startsWith(CANVAS_CONVERSATION_TITLE_PREFIX));
        if (existingCanvas) {
          setActiveId(existingCanvas.id);
          writeLocalStorageValue(CANVAS_CONVERSATION_STORAGE_KEY, String(existingCanvas.id));
        } else {
          const now = new Date().toISOString();
          const draft: Conversation = {
            id: DRAFT_CONVERSATION_ID,
            user_id: userInfo?.id || 0,
            title: CANVAS_CONVERSATION_TITLE_PREFIX,
            group_id: resolveGroupID(),
            platform: selectedPlatform,
            model: selectedModelID,
            created_at: now,
            updated_at: now,
          };
          setConversations(prev => [draft, ...prev.filter(c => c.id !== DRAFT_CONVERSATION_ID)]);
          setActiveId(DRAFT_CONVERSATION_ID);
          setMessages([]);
        }
      }
    } else {
      const prevChatId = chatActiveIdRef.current;
      if (prevChatId && prevChatId !== DRAFT_CONVERSATION_ID &&
          conversations.some(c => c.id === prevChatId && !c.title.startsWith(CANVAS_CONVERSATION_TITLE_PREFIX))) {
        setActiveId(prevChatId);
      } else {
        setActiveId(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasMode, conversationsLoaded]);

  // Persist canvas conversation id
  useEffect(() => {
    if (canvasMode && activeId && activeId !== DRAFT_CONVERSATION_ID) {
      const conv = conversations.find(c => c.id === activeId);
      if (conv && conv.title.startsWith(CANVAS_CONVERSATION_TITLE_PREFIX)) {
        writeLocalStorageValue(CANVAS_CONVERSATION_STORAGE_KEY, String(activeId));
      }
    }
  }, [canvasMode, activeId, conversations]);

  // Load canvas tasks when entering canvas mode
  useEffect(() => {
    if (!canvasMode || !activeId || activeId === DRAFT_CONVERSATION_ID) {
      setCanvasTasks([]);
      return;
    }
    let cancelled = false;
    api.listGenerationTasks(activeId)
      .then(tasks => {
        if (!cancelled) setCanvasTasks(tasks);
      })
      .catch(() => {
        if (!cancelled) setCanvasTasks([]);
      });
    return () => { cancelled = true; };
  }, [canvasMode, activeId, messages]);

  // Resume in-flight canvas tasks on mount / active change
  useEffect(() => {
    if (!canvasMode || !activeId || activeId === DRAFT_CONVERSATION_ID || isStreaming) return;
    let cancelled = false;
    api.listGenerationTasks(activeId).then(tasks => {
      if (cancelled) return;
      setCanvasTasks(tasks);
      const inflight = tasks.find(t => t.status === 'pending' || t.status === 'processing');
      if (inflight) {
        setIsStreaming(true);
        setStreamConversationId(activeId);
        pollGenerationTask(inflight.id, activeId)
          .then(() => { api.getUserInfo().then(setUserInfo).catch(() => {}); })
          .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'generation failed'); })
          .finally(() => { if (!cancelled) { setIsStreaming(false); setStreamConversationId(null); } });
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasMode, activeId]);

  // ── Computed conversations ────────────────────────────────────────────

  const sidebarConversations = useMemo(() => {
    const canvasConvId = Number(readLocalStorageValue(CANVAS_CONVERSATION_STORAGE_KEY));
    return conversations.filter(c =>
      c.id !== canvasConvId && !c.title.startsWith(CANVAS_CONVERSATION_TITLE_PREFIX)
    );
  }, [conversations]);

  const canvasConversations = useMemo(() => {
    return conversations.filter(c =>
      c.title.startsWith(CANVAS_CONVERSATION_TITLE_PREFIX) && c.id !== DRAFT_CONVERSATION_ID
    );
  }, [conversations]);

  // ── Persist active conversation id ────────────────────────────────────

  useEffect(() => {
    activeIdRef.current = activeId;
    if (typeof window === 'undefined' || !conversationsLoaded) return;
    if (activeId && activeId !== DRAFT_CONVERSATION_ID) {
      writeLocalStorageValue(ACTIVE_CONVERSATION_STORAGE_KEY, String(activeId));
    } else {
      writeLocalStorageValue(ACTIVE_CONVERSATION_STORAGE_KEY, null);
    }
  }, [activeId, conversationsLoaded]);

  // Persist selected model
  useEffect(() => {
    if (typeof window === 'undefined' || models.length === 0) return;
    if (selectedModel && models.some(item => modelOptionValue(item) === selectedModel)) {
      writeLocalStorageValue(SELECTED_MODEL_STORAGE_KEY, selectedModel);
    } else {
      writeLocalStorageValue(SELECTED_MODEL_STORAGE_KEY, null);
    }
  }, [models, selectedModel]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeId || activeId === DRAFT_CONVERSATION_ID) { setMessages([]); return; }
    if (skipNextMessagesLoadRef.current === activeId) {
      skipNextMessagesLoadRef.current = null;
      return;
    }
    api.listMessages(activeId).then(setMessages).catch(() => {});
  }, [activeId, setMessages]);

  // Blob URL cleanup on unmount
  useEffect(() => {
    const registry = blobUrlRegistryRef.current;
    return () => {
      revokeBlobRegistry(registry);
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    const messagesArea = messagesAreaRef.current;
    if (!messagesArea) return;
    messagesArea.scrollTo({ top: messagesArea.scrollHeight, behavior: 'smooth' });
  }, [messages, streamContent, streamReasoning]);

  // Viewport detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const updateViewport = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };

    updateViewport();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateViewport);
      return () => mediaQuery.removeEventListener('change', updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  // Close sidebar on mobile
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Interaction notice auto-dismiss
  useEffect(() => {
    if (!interactionNotice) return;
    const timer = window.setTimeout(() => setInteractionNotice(''), 1400);
    return () => window.clearTimeout(timer);
  }, [interactionNotice]);

  // Close expanded prompt popover on outside click
  useEffect(() => {
    if (!expandedPromptNodeId) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-prompt-popover]')) return;
      setExpandedPromptNodeId(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [expandedPromptNodeId]);

  // Edit panel setup (canvas resize sync)
  useEffect(() => {
    if (!editSource || !isEditPanelOpen) return;
    let cancelled = false;

    const syncCanvas = async () => {
      const canvas = editCanvasRef.current;
      const container = editCanvasContainerRef.current;
      if (!canvas || !container) return;

      const image = await loadImageElement(editSource.url);
      if (cancelled) return;

      const maxWidth = container.clientWidth || image.naturalWidth;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      const maxHeight = isMobile
        ? Math.min(viewportHeight * 0.45, 360)
        : Math.min(viewportHeight * 0.62, 720);
      const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      setEditStageSize({ width, height });

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      setEditSelection(null);
      setDraftEditSelection(null);
      selectionStartRef.current = null;
    };

    void syncCanvas().catch(err => setError(err instanceof Error ? err.message : 'Failed to load image'));
    if (typeof ResizeObserver === 'undefined') {
      return () => { cancelled = true; };
    }

    const observer = new ResizeObserver(() => {
      void syncCanvas().catch(err => setError(err instanceof Error ? err.message : 'Failed to load image'));
    });
    if (editCanvasContainerRef.current) observer.observe(editCanvasContainerRef.current);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [editSource, isEditPanelOpen, isMobile]);

  // ── Callbacks needed by subsequent effects (declared early) ──────────

  const showNextPreviewImage = useCallback((direction: -1 | 1) => {
    setPreviewImage(current => {
      if (!current || current.images.length < 2) return current;
      return {
        ...current,
        index: (current.index + direction + current.images.length) % current.images.length,
      };
    });
  }, []);

  const cancelEditPanel = useCallback(() => {
    setIsEditPanelOpen(false);
    setEditSource(null);
    setConfirmedImageEdit(null);
    setEditSelection(null);
    setDraftEditSelection(null);
    setEditStageSize(null);
    selectionStartRef.current = null;
  }, []);

  // Preview image keyboard navigation
  useEffect(() => {
    if (!previewImage) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewImage(null);
      if (event.key === 'ArrowLeft') showNextPreviewImage(-1);
      if (event.key === 'ArrowRight') showNextPreviewImage(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewImage, showNextPreviewImage]);

  // Escape key closes edit panel
  useEffect(() => {
    if (!isEditPanelOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelEditPanel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditPanelOpen, cancelEditPanel]);

  // ── renderCustomSelect ────────────────────────────────────────────────

  const renderCustomSelect = useCallback(({
    id,
    value,
    options,
    onChange,
    ariaLabel,
    variant = 'chip',
    alignRight = false,
  }: {
    id: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    ariaLabel: string;
    variant?: 'model' | 'chip';
    alignRight?: boolean;
  }) => {
    const selectedOption = options.find(option => option.value === value);
    const isOpen = openSelectId === id;
    const buttonStyle = variant === 'model'
      ? { ...styles.selectTrigger, ...styles.modelSelectTrigger, ...(isMobile ? styles.modelSelectTriggerMobile : null) }
      : { ...styles.selectTrigger, ...styles.chipSelectTrigger, ...(isMobile ? styles.chipSelectTriggerMobile : null) };
    const listbox = (
      <div
        style={{
          ...styles.selectPopover,
          ...(variant === 'model' ? styles.selectPopoverModel : styles.selectPopoverChip),
          ...(isMobile ? styles.selectPopoverMobile : null),
          ...(alignRight ? { left: 'auto', right: 0, width: 'auto', minWidth: '100%', maxWidth: 320 } : null),
        }}
        role="listbox"
        aria-label={ariaLabel}
      >
        {options.map(option => {
          const optionSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              style={{
                ...styles.selectOption,
                ...(optionSelected ? styles.selectOptionActive : null),
                ...(variant === 'model' ? styles.selectOptionModel : null),
              }}
              role="option"
              aria-selected={optionSelected}
              onClick={() => {
                onChange(option.value);
                setOpenSelectId(null);
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );

    return (
      <div style={{ ...styles.selectWrap, ...(variant === 'model' ? styles.modelSelectWrap : null) }}>
        <button
          type="button"
          style={{ ...buttonStyle, ...(isOpen ? styles.selectTriggerOpen : null) }}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setOpenSelectId(current => current === id ? null : id)}
        >
          <span style={styles.selectTriggerText}>{selectedOption?.label || ariaLabel}</span>
          <span aria-hidden="true" style={styles.selectTriggerCaret}>v</span>
        </button>
        {isOpen && (
          isMobile ? (
            <div style={styles.selectOverlay} onClick={() => setOpenSelectId(null)}>
              <div style={styles.selectSheet} onClick={event => event.stopPropagation()}>
                <div style={styles.selectSheetHeader}>{ariaLabel}</div>
                {listbox}
              </div>
            </div>
          ) : listbox
        )}
      </div>
    );
  }, [openSelectId, isMobile]);

  // ── Conversation management callbacks ─────────────────────────────────

  const createConversation = useCallback(() => {
    const now = new Date().toISOString();
    const draft: Conversation = {
      id: DRAFT_CONVERSATION_ID,
      user_id: userInfo?.id || 0,
      title: '',
      group_id: resolveGroupID(),
      platform: selectedPlatform,
      model: selectedModelID,
      created_at: now,
      updated_at: now,
    };
    setConversations(prev => [draft, ...prev.filter(c => c.id !== DRAFT_CONVERSATION_ID)]);
    setActiveId(DRAFT_CONVERSATION_ID);
    setMessages([]);
    setPendingImages([]);
    setEditSource(null);
    setConfirmedImageEdit(null);
    setIsEditPanelOpen(false);
    setEditSelection(null);
    setDraftEditSelection(null);
    setEditStageSize(null);
    setError('');
    setRetryRequest(null);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile, resolveGroupID, selectedPlatform, selectedModelID, userInfo?.id]);

  const createCanvasConversation = useCallback(() => {
    const now = new Date().toISOString();
    const draft: Conversation = {
      id: DRAFT_CONVERSATION_ID,
      user_id: userInfo?.id || 0,
      title: CANVAS_CONVERSATION_TITLE_PREFIX,
      group_id: resolveGroupID(),
      platform: selectedPlatform,
      model: selectedModelID,
      created_at: now,
      updated_at: now,
    };
    setConversations(prev => [draft, ...prev.filter(c => c.id !== DRAFT_CONVERSATION_ID)]);
    setActiveId(DRAFT_CONVERSATION_ID);
    setMessages([]);
    setPendingImages([]);
    setError('');
    setRetryRequest(null);
    setCanvasZoom(1);
    setCanvasPan({ x: 0, y: 0 });
  }, [resolveGroupID, selectedPlatform, selectedModelID, userInfo?.id]);

  const openCanvasConversation = useCallback((id: number) => {
    setActiveId(id);
    writeLocalStorageValue(CANVAS_CONVERSATION_STORAGE_KEY, String(id));
    setError('');
    setRetryRequest(null);
    setCanvasZoom(1);
    setCanvasPan({ x: 0, y: 0 });
  }, []);

  const deleteConversation = useCallback(async (id: number) => {
    const confirmed = await window.airgate?.confirm?.(t('playground.delete_conversation_confirm'), {
      title: t('playground.delete_conversation'),
      danger: true,
    });
    if (!confirmed) return;

    if (id === DRAFT_CONVERSATION_ID) {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      return;
    }

    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch { /* ignore */ }
  }, [activeId, t]);

  // ── streamAssistantResponse ───────────────────────────────────────────

  const streamAssistantResponse = useCallback(async ({
    conversationID,
    requestMessages,
    model,
    groupID,
    platform,
    supportsReasoning: requestSupportsReasoning,
    reasoningEffort: requestReasoningEffort,
    titleContent,
  }: StreamAssistantOptions) => {
    const nextRetryRequest: RetryRequest = {
      conversationID,
      requestMessages: requestMessages.map(msg => ({ ...msg })),
      model,
      groupID,
      platform,
      supportsReasoning: requestSupportsReasoning,
      reasoningEffort: requestReasoningEffort,
    };
    setError('');
    setRetryRequest(null);
    setIsStreaming(true);
    setStreamConversationId(conversationID);
    streamContextRef.current = { conversationId: conversationID, model };
    setStreamContent('');
    setStreamReasoning('');

    try {
      const abort = new AbortController();
      abortRef.current = abort;

      let accumulated = '';
      let accumulatedReasoning = '';
      const baseRequest = {
        model,
        messages: requestMessages.map(msg => ({
          role: msg.role,
          content: toChatMessageContent(msg.role, replaceBlobUrlsWithBase64(msg.content, blobUrlRegistryRef.current)),
        })),
        stream: true as const,
        ...(requestSupportsReasoning ? { reasoning_effort: requestReasoningEffort ?? reasoningEffort } : {}),
      };
      const finishAssistantResponse = async (usage: { input_tokens: number; output_tokens: number; model: string; cost: number }) => {
        if (!accumulated) {
          if (activeIdRef.current === conversationID) {
            setError(t('playground.no_response'));
            setRetryRequest(nextRetryRequest);
          }
          setStreamContent('');
          setStreamReasoning('');
          setStreamConversationId(null);
          streamContextRef.current = null;
          setIsStreaming(false);
          return;
        }
        const persistedBase64 = replaceBlobUrlsWithBase64(accumulated, blobUrlRegistryRef.current);
        const persisted = await api.persistMessage({
          conversation_id: conversationID,
          role: 'assistant',
          content: persistedBase64,
          reasoning: accumulatedReasoning,
          platform,
          model: usage.model || model,
          group_id: groupID,
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens,
          cost: usage.cost,
        });
        if (activeIdRef.current === conversationID) {
          setMessagesRaw(prev => [...prev, { ...persisted, content: accumulated }]);
        }
        setRetryRequest(null);
        if (titleContent) {
          setConversations(prev => prev.map(c =>
            c.id === conversationID && !c.title
              ? { ...c, title: titleFromMessageContent(titleContent), updated_at: new Date().toISOString() }
              : c
          ));
        }
        setStreamContent('');
        setStreamReasoning('');
        setStreamConversationId(null);
        streamContextRef.current = null;
        setIsStreaming(false);
      };

      await chatCompletionsStream(
        platform,
        {
          ...baseRequest,
        },
        {
          onData: (text) => {
            accumulated += replaceBase64WithBlobUrls(text, blobUrlRegistryRef.current);
            setStreamContent(accumulated);
          },
          onReasoning: (text) => {
            accumulatedReasoning += text;
            setStreamReasoning(accumulatedReasoning);
          },
          onDone: finishAssistantResponse,
          onError: (err) => {
            if (activeIdRef.current === conversationID) {
              setError(err);
              setRetryRequest(nextRetryRequest);
            }
            setIsStreaming(false);
            setStreamContent('');
            setStreamReasoning('');
            setStreamConversationId(null);
            streamContextRef.current = null;
          },
        },
        abort.signal,
      );
    } catch (e) {
      if (activeIdRef.current === conversationID) {
        setError(e instanceof Error ? e.message : 'stream failed');
        setRetryRequest(nextRetryRequest);
      }
      setIsStreaming(false);
      setStreamContent('');
      setStreamReasoning('');
      setStreamConversationId(null);
      streamContextRef.current = null;
    }
  }, [reasoningEffort, t]);

  // ── pollGenerationTask ─────────────────────────────────────────────────────

  const pollGenerationTask = useCallback(async (taskId: number, conversationID: number) => {
    const maxAttempts = 120;
    setCanvasTaskStatus('pending');
    try {
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const task = await api.getGenerationTask(taskId);
          if (task.status === 'processing') setCanvasTaskStatus('processing');
          setCanvasTasks(prev => prev.map(item => item.id === task.id ? task : item));
          if (task.status === 'completed') {
            if (activeIdRef.current === conversationID) {
              const msgs = await api.listMessages(conversationID);
              const tasks = await api.listGenerationTasks(conversationID);
              setMessages(msgs);
              setCanvasTasks(tasks);
            }
            return task;
          }
          if (task.status === 'failed') {
            throw new Error(task.error_message || 'Image generation failed');
          }
        } catch (e) {
          if (i === maxAttempts - 1) throw e;
        }
      }
      throw new Error('Image generation timed out');
    } finally {
      setCanvasTaskStatus('idle');
    }
  }, [setMessages]);

  // ── sendMessage ───────────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    if ((!input.trim() && pendingImages.length === 0) || isStreaming || !activeId) return;

    pendingRefocusRef.current = true;
    const content = messageContentWithImages(input, pendingImages);
    const groupID = resolveGroupID();
    let conversationID = activeId;
    const requestMessages = [...messages, {
      id: Date.now(),
      conversation_id: activeId,
      role: 'user',
      content,
      reasoning_effort: selectedModelSupportsReasoning ? reasoningEffort : undefined,
      platform: selectedPlatform,
      model: selectedModelID,
      group_id: groupID,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      created_at: new Date().toISOString(),
    }];

    setInput('');
    setPendingImages([]);
    setConfirmedImageEdit(null);
    if (inputRef.current) {
      inputRef.current.style.height = '24px';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError('');
    setRetryRequest(null);
    setMessages(requestMessages);
    setIsStreaming(true);
    setStreamConversationId(conversationID);
    streamContextRef.current = { conversationId: conversationID, model: selectedModelID };
    setStreamContent('');
    setStreamReasoning('');

    try {
      if (!selectedPlatform || !selectedModelID) {
        throw new Error('Model required');
      }
      if (conversationID === DRAFT_CONVERSATION_ID) {
        const isCanvasConv = canvasMode;
        const conv = await api.createConversation({
          title: isCanvasConv ? CANVAS_CONVERSATION_TITLE_PREFIX : '',
          group_id: groupID,
          platform: selectedPlatform,
          model: selectedModelID,
        });
        conversationID = conv.id;
        if (isCanvasConv) {
          writeLocalStorageValue(CANVAS_CONVERSATION_STORAGE_KEY, String(conv.id));
        }
        if (activeIdRef.current === DRAFT_CONVERSATION_ID) {
          activeIdRef.current = conv.id;
          skipNextMessagesLoadRef.current = conv.id;
          setActiveId(conv.id);
          setMessages(prev => prev.map(msg => ({ ...msg, conversation_id: conv.id })));
        }
        setConversations(prev => [conv, ...prev.filter(c => c.id !== DRAFT_CONVERSATION_ID)]);
      }

      if (selectedModelIsImage) {
        const prompt = input.trim() || '根据参考图生成图像。';
        const task = await api.createGenerationTask({
          conversation_id: conversationID,
          kind: 'image',
          operation: pendingImages.length > 0 ? 'edit' : 'generate',
          platform: selectedPlatform,
          model: selectedModelID,
          prompt,
          group_id: groupID,
          parameters: resolvedImageSize ? { size: resolvedImageSize } : undefined,
          inputs: pendingImages.length
            ? pendingImages.map(image => ({ type: 'image' as const, role: 'source', url: image.url }))
            : undefined,
          message_content: content,
        });
        if (canvasMode) {
          setCanvasTasks(prev => [task, ...prev.filter(item => item.id !== task.id)]);
        }
        const msgs = await api.listMessages(conversationID);
        if (activeIdRef.current === conversationID) {
          setMessages(msgs);
        }
        setConversations(prev => prev.map(c =>
          c.id === conversationID && !c.title
            ? { ...c, title: titleFromMessageContent(content), updated_at: new Date().toISOString() }
            : c
        ));
        await pollGenerationTask(task.id, conversationID);
        api.getUserInfo().then(setUserInfo).catch(() => {});
        setIsStreaming(false);
        setStreamContent('');
        setStreamReasoning('');
        setStreamConversationId(null);
        streamContextRef.current = null;
        return;
      }

      await api.persistMessage({
        conversation_id: conversationID,
        role: 'user',
        content,
        reasoning_effort: selectedModelSupportsReasoning ? reasoningEffort : undefined,
        platform: selectedPlatform,
        model: selectedModelID,
        group_id: groupID,
      });

      await streamAssistantResponse({
        conversationID,
        requestMessages: requestMessages.map(msg => ({ ...msg, conversation_id: conversationID })),
        model: selectedModelID,
        groupID,
        platform: selectedPlatform,
        supportsReasoning: selectedModelSupportsReasoning,
        reasoningEffort,
        titleContent: content,
      });
    } catch (e) {
      if (activeIdRef.current === conversationID) {
        setError(e instanceof Error ? e.message : 'stream failed');
      }
      setIsStreaming(false);
      setStreamContent('');
      setStreamReasoning('');
      setStreamConversationId(null);
      streamContextRef.current = null;
    }
  }, [activeId, canvasMode, input, isStreaming, messages, pendingImages, pollGenerationTask, reasoningEffort, resolveGroupID, resolvedImageSize, selectedPlatform, selectedModelID, selectedModelIsImage, selectedModelSupportsReasoning, streamAssistantResponse]);

  // ── sendCanvasMessage ─────────────────────────────────────────────────

  const sendCanvasMessage = useCallback(async () => {
    if (!input.trim() || isStreaming || !activeId || !selectedPlatform || !selectedModelID) return;

    pendingRefocusRef.current = true;
    const prompt = input.trim();
    let conversationID = activeId;

    setInput('');
    setPendingImages([]);
    setConfirmedImageEdit(null);
    if (inputRef.current) inputRef.current.style.height = '24px';
    setError('');
    setRetryRequest(null);
    setIsStreaming(true);
    setStreamConversationId(conversationID);

    try {
      const groupID = resolveGroupID();

      if (conversationID === DRAFT_CONVERSATION_ID) {
        const conv = await api.createConversation({
          title: CANVAS_CONVERSATION_TITLE_PREFIX,
          group_id: groupID,
          platform: selectedPlatform,
          model: selectedModelID,
        });
        conversationID = conv.id;
        writeLocalStorageValue(CANVAS_CONVERSATION_STORAGE_KEY, String(conv.id));
        if (activeIdRef.current === DRAFT_CONVERSATION_ID) {
          activeIdRef.current = conv.id;
          skipNextMessagesLoadRef.current = conv.id;
          setActiveId(conv.id);
        }
        setConversations(prev => [conv, ...prev.filter(c => c.id !== DRAFT_CONVERSATION_ID)]);
      }

      const task = await api.createGenerationTask({
        conversation_id: conversationID,
        kind: 'image',
        operation: 'generate',
        platform: selectedPlatform,
        model: selectedModelID,
        prompt,
        parameters: resolvedImageSize ? { size: resolvedImageSize } : undefined,
        group_id: resolveGroupID(),
      });
      setCanvasTasks(prev => [task, ...prev.filter(item => item.id !== task.id)]);

      // Immediately show user message
      const msgs = await api.listMessages(conversationID);
      if (activeIdRef.current === conversationID) {
        setMessages(msgs);
      }

      // Poll for completion
      await pollGenerationTask(task.id, conversationID);

      // Update user info (balance)
      api.getUserInfo().then(setUserInfo).catch(() => {});

    } catch (e) {
      if (activeIdRef.current === conversationID) {
        setError(e instanceof Error ? e.message : 'generation failed');
      }
    } finally {
      setIsStreaming(false);
      setStreamConversationId(null);
    }
  }, [activeId, input, isStreaming, resolveGroupID, resolvedImageSize, selectedModelID, selectedPlatform, pollGenerationTask]);

  // ── regenerateCanvasNode ──────────────────────────────────────────────

  const regenerateCanvasNode = useCallback(async (node: CanvasWorkflowNode) => {
    if (isStreaming || !activeId || activeId === DRAFT_CONVERSATION_ID || !selectedPlatform) return;
    const model = node.model || selectedModelID;
    if (!model) return;

    setError('');
    setRetryRequest(null);
    setIsStreaming(true);
    setStreamConversationId(activeId);

    try {
      const task = await api.createGenerationTask({
        conversation_id: activeId,
        kind: 'image',
        operation: 'generate',
        platform: selectedPlatform,
        model,
        prompt: node.prompt,
        parameters: resolvedImageSize ? { size: resolvedImageSize } : undefined,
        group_id: resolveGroupID(),
      });
      setCanvasTasks(prev => [task, ...prev.filter(item => item.id !== task.id)]);
      const msgs = await api.listMessages(activeId);
      if (activeIdRef.current === activeId) setMessages(msgs);
      await pollGenerationTask(task.id, activeId);
      api.getUserInfo().then(setUserInfo).catch(() => {});
    } catch (e) {
      if (activeIdRef.current === activeId) {
        setError(e instanceof Error ? e.message : 'generation failed');
      }
    } finally {
      setIsStreaming(false);
      setStreamConversationId(null);
    }
  }, [activeId, isStreaming, resolveGroupID, resolvedImageSize, selectedModelID, selectedPlatform, pollGenerationTask, setMessages]);

  // ── Image file callbacks ──────────────────────────────────────────────

  const addImageFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;

    try {
      const nextImages = await imagesFromFiles(files);
      if (!nextImages.length) return;
      setPendingImages(prev => [...prev, ...nextImages]);
      setError('');
      setRetryRequest(null);
    } catch (err) {
      setRetryRequest(null);
      setError(err instanceof Error ? err.message : 'Failed to read image');
    }
  }, []);

  const selectEditImage = useCallback(async (file?: File) => {
    if (!file) return;
    try {
      const nextSource = await editImageFromFile(file);
      setEditSource(nextSource);
      setConfirmedImageEdit(null);
      setIsEditPanelOpen(true);
      setEditSelection(null);
      setDraftEditSelection(null);
      setEditStageSize(null);
      setError('');
      setRetryRequest(null);
    } catch (err) {
      setRetryRequest(null);
      setError(err instanceof Error ? err.message : 'Failed to read image');
    }
  }, []);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await addImageFiles(Array.from(e.target.files || []));
    e.target.value = '';
  }, [addImageFiles]);

  const handleEditImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await selectEditImage(e.target.files?.[0]);
    e.target.value = '';
  }, [selectEditImage]);

  const editGeneratedImage = useCallback(async (
    url: string,
    alt: string,
    sourceModel?: string,
    sourcePlatform?: string,
  ) => {
    if (isStreaming) return;
    try {
      const nextSource = await editImageFromUrl(url, alt);

      if (!selectedModelIsImage) {
        const fromAssistant = sourceModel
          ? models.find(m => m.id === sourceModel
              && (!sourcePlatform || m.platform === sourcePlatform)
              && isImageModel(m))
          : undefined;
        const fallback = fromAssistant || models.find(isImageModel);
        if (fallback) {
          setSelectedModel(modelOptionValue(fallback));
        } else {
          setError(t('playground.no_image_model_available', {
            defaultValue: 'No image model available — pick one to edit this image.',
          }));
          return;
        }
      }

      setEditSource(nextSource);
      setConfirmedImageEdit(null);
      setIsEditPanelOpen(true);
      setEditSelection(null);
      setDraftEditSelection(null);
      setEditStageSize(null);
      setError('');
      setRetryRequest(null);
      pendingRefocusRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
    }
  }, [isStreaming, models, selectedModelIsImage, t]);

  const triggerImagePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const triggerEditImagePicker = useCallback(() => {
    editFileInputRef.current?.click();
  }, []);

  const openPendingImageForEdit = useCallback(async (image: PendingImage) => {
    if (isStreaming || !image.file) return;
    setPendingImages([image]);
    await selectEditImage(image.file);
  }, [isStreaming, selectEditImage]);

  const clearEditSelection = useCallback(() => {
    setEditSelection(null);
    setDraftEditSelection(null);
    selectionStartRef.current = null;
  }, []);

  const confirmEditSelection = useCallback(async () => {
    if (!editSource || !editSelection) return;
    const canvas = editCanvasRef.current;
    if (!canvas) return;
    const image = await loadImageElement(editSource.url);
    const scaleX = image.naturalWidth / canvas.width;
    const scaleY = image.naturalHeight / canvas.height;
    setConfirmedImageEdit({
      source: editSource,
      sourceWidth: image.naturalWidth,
      sourceHeight: image.naturalHeight,
      selection: {
        x: Math.floor(editSelection.x * scaleX),
        y: Math.floor(editSelection.y * scaleY),
        width: Math.ceil(editSelection.width * scaleX),
        height: Math.ceil(editSelection.height * scaleY),
      },
    });
    setPendingImages([editSource]);
    setIsEditPanelOpen(false);
    setDraftEditSelection(null);
    setEditStageSize(null);
    selectionStartRef.current = null;
    pendingRefocusRef.current = true;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [editSelection, editSource]);

  // ── Selection pointer handlers ────────────────────────────────────────

  const selectionPointFromEvent = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = editCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: clampNumber((event.clientX - rect.left) * scaleX, 0, canvas.width),
      y: clampNumber((event.clientY - rect.top) * scaleY, 0, canvas.height),
    };
  }, []);

  const handleSelectionPointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const point = selectionPointFromEvent(event);
    if (!point) return;
    selectionStartRef.current = point;
    setEditSelection(null);
    setDraftEditSelection({ x: point.x, y: point.y, width: 0, height: 0 });
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [selectionPointFromEvent]);

  const handleSelectionPointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const start = selectionStartRef.current;
    if (!start) return;
    event.preventDefault();
    const point = selectionPointFromEvent(event);
    if (point) setDraftEditSelection(selectionRectFromPoints(start, point));
  }, [selectionPointFromEvent]);

  const finishSelectionDrag = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const start = selectionStartRef.current;
    const point = selectionPointFromEvent(event);
    const selection = start && point ? selectionRectFromPoints(start, point) : draftEditSelection;
    selectionStartRef.current = null;
    setDraftEditSelection(null);
    setEditSelection(isUsableSelection(selection) ? selection : null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, [draftEditSelection, selectionPointFromEvent]);

  const createEditMaskBlob = useCallback(async (edit: ConfirmedImageEdit) => {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = edit.sourceWidth;
    maskCanvas.height = edit.sourceHeight;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create mask');

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    ctx.clearRect(edit.selection.x, edit.selection.y, edit.selection.width, edit.selection.height);
    return canvasToBlob(maskCanvas);
  }, []);

  // ── submitImageEdit ───────────────────────────────────────────────────

  const submitImageEdit = useCallback(async () => {
    if (!activeId || isStreaming || isEditingImage) return;
    pendingRefocusRef.current = true;
    if (!selectedPlatform || !selectedModelID) {
      setRetryRequest(null);
      setError(t('playground.select_model_first'));
      return;
    }
    if (!selectedModelIsImage) {
      setRetryRequest(null);
      setError(t('playground.select_image_model_first'));
      return;
    }
    if (!confirmedImageEdit) {
      setRetryRequest(null);
      setError(t('playground.select_image_region_first', { defaultValue: 'Select a region to edit first.' }));
      return;
    }

    const prompt = input.trim();
    if (!prompt) {
      setRetryRequest(null);
      setError(t('playground.describe_image_change_first'));
      return;
    }

    const groupID = resolveGroupID();
    let conversationID = activeId;
    const editAnnotation = {
      imageIndex: 0,
      rect: {
        x: confirmedImageEdit.selection.x / confirmedImageEdit.sourceWidth,
        y: confirmedImageEdit.selection.y / confirmedImageEdit.sourceHeight,
        width: confirmedImageEdit.selection.width / confirmedImageEdit.sourceWidth,
        height: confirmedImageEdit.selection.height / confirmedImageEdit.sourceHeight,
      },
    };
    const userContent = messageContentWithImages(prompt, [confirmedImageEdit.source], [editAnnotation]);
    const localUserMessage: Message = {
      id: Date.now(),
      conversation_id: activeId,
      role: 'user',
      content: userContent,
      platform: selectedPlatform,
      model: selectedModelID,
      group_id: groupID,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      created_at: new Date().toISOString(),
    };

    setInput('');
    if (inputRef.current) inputRef.current.style.height = '24px';
    setError('');
    setRetryRequest(null);
    setMessages(prev => [...prev, localUserMessage]);
    setIsStreaming(true);
    setIsEditingImage(true);
    setStreamConversationId(conversationID);
    streamContextRef.current = { conversationId: conversationID, model: selectedModelID };
    setStreamContent('');
    setStreamReasoning('');

    try {
      if (conversationID === DRAFT_CONVERSATION_ID) {
        const isCanvasConv = canvasMode;
        const conv = await api.createConversation({
          title: isCanvasConv ? CANVAS_CONVERSATION_TITLE_PREFIX : '',
          group_id: groupID,
          platform: selectedPlatform,
          model: selectedModelID,
        });
        conversationID = conv.id;
        if (isCanvasConv) {
          writeLocalStorageValue(CANVAS_CONVERSATION_STORAGE_KEY, String(conv.id));
        }
        if (activeIdRef.current === DRAFT_CONVERSATION_ID) {
          activeIdRef.current = conv.id;
          skipNextMessagesLoadRef.current = conv.id;
          setActiveId(conv.id);
          setMessages(prev => prev.map(msg => ({ ...msg, conversation_id: conv.id })));
        }
        setStreamConversationId(conv.id);
        streamContextRef.current = { conversationId: conv.id, model: selectedModelID };
        setConversations(prev => [conv, ...prev.filter(c => c.id !== DRAFT_CONVERSATION_ID)]);
      }

      const abort = new AbortController();
      abortRef.current = abort;
      const maskBlob = await createEditMaskBlob(confirmedImageEdit);
      if (abort.signal.aborted) return;

      const editSize = resolvedImageSize || sourceAlignedImageSize(confirmedImageEdit.sourceWidth, confirmedImageEdit.sourceHeight);
      if (abort.signal.aborted) return;

      const editPrompt = `${prompt}\n\nEdit only the transparent area indicated by the mask. Keep everything outside the mask unchanged.`;
      const sourceDataURL = await fileToDataURL(confirmedImageEdit.source.file);
      const maskDataURL = await blobToDataURL(maskBlob);
      const task = await api.createGenerationTask({
        conversation_id: conversationID,
        kind: 'image',
        operation: 'inpaint',
        platform: selectedPlatform,
        model: selectedModelID,
        prompt: editPrompt,
        group_id: groupID,
        parameters: editSize ? { size: editSize } : undefined,
        inputs: [{ type: 'image', role: 'source', url: sourceDataURL }],
        mask: { type: 'image', role: 'mask', url: maskDataURL },
        message_content: userContent,
      });
      if (abort.signal.aborted) return;
      const msgs = await api.listMessages(conversationID);
      if (activeIdRef.current === conversationID) {
        setMessages(msgs);
      }
      await pollGenerationTask(task.id, conversationID);
      api.getUserInfo().then(setUserInfo).catch(() => {});
      setConversations(prev => prev.map(c =>
        c.id === conversationID && !c.title
          ? { ...c, title: titleFromMessageContent(userContent), updated_at: new Date().toISOString() }
          : c
      ));
      setPendingImages([]);
      setEditSource(null);
      setConfirmedImageEdit(null);
      setIsEditPanelOpen(false);
      setEditSelection(null);
      setDraftEditSelection(null);
      setEditStageSize(null);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      if (activeIdRef.current === conversationID) {
        setError(e instanceof Error ? e.message : 'image edit failed');
      }
    } finally {
      setIsStreaming(false);
      setIsEditingImage(false);
      setStreamContent('');
      setStreamReasoning('');
      setStreamConversationId(null);
      streamContextRef.current = null;
    }
  }, [activeId, confirmedImageEdit, createEditMaskBlob, input, isEditingImage, isStreaming, pollGenerationTask, resolveGroupID, resolvedImageSize, selectedModelID, selectedModelIsImage, selectedPlatform, t]);

  // ── Clipboard & image management callbacks ────────────────────────────

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.items)
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((file): file is File => Boolean(file));

    if (files.length) {
      void addImageFiles(files);
    }
  }, [addImageFiles]);

  const removePendingImage = useCallback((id: string) => {
    setPendingImages(prev => prev.filter(image => image.id !== id));
    setConfirmedImageEdit(current => current?.source.id === id ? null : current);
  }, []);

  // ── stopStreaming ─────────────────────────────────────────────────────

  const stopStreaming = useCallback(() => {
    pendingRefocusRef.current = true;
    abortRef.current?.abort();
    const streamContext = streamContextRef.current;
    if (streamContent || streamReasoning) {
      const conversationId = streamContext?.conversationId;
      if (conversationId && activeIdRef.current === conversationId) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          conversation_id: conversationId,
          role: 'assistant',
          content: streamContent,
          reasoning: streamReasoning,
          platform: '', model: streamContext.model, group_id: 0,
          input_tokens: 0, output_tokens: 0, cost: 0,
          created_at: new Date().toISOString(),
        }]);
      }
    }
    setStreamContent('');
    setStreamReasoning('');
    setStreamConversationId(null);
    streamContextRef.current = null;
    setIsEditingImage(false);
    setIsStreaming(false);
  }, [streamContent, streamReasoning]);

  // ── Computed scalars ──────────────────────────────────────────────────

  const activeConv = conversations.find(c => c.id === activeId);
  const lastMessage = messages[messages.length - 1];
  const visibleEditSelection = draftEditSelection || editSelection;
  const isEditSelectionConfirmable = Boolean(isEditPanelOpen && editSource && editSelection);
  const hasRecoverableUserMessage = Boolean(activeId && activeId !== DRAFT_CONVERSATION_ID && lastMessage?.role === 'user' && !error && !isStreaming);
  const isActiveConversationStreaming = isStreaming && streamConversationId === activeId;
  const canSendMessage = Boolean((input.trim() || (pendingImages.length > 0 && !confirmedImageEdit)) && selectedPlatform && selectedModelID) && !isStreaming && !isEditingImage;

  // ── canvasWorkflowNodes ───────────────────────────────────────────────

  const canvasWorkflowNodes = useMemo<CanvasWorkflowNode[]>(() => {
    if (!canvasMode || !activeId) return [];
    const nodes: CanvasWorkflowNode[] = [];
    const sortedCanvasTasks = [...canvasTasks].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let taskIndex = 0;
    let activeNode: CanvasWorkflowNode | null = null;
    const allMsgs = [...messages];
    if (isActiveConversationStreaming && streamContent) {
      allMsgs.push({ id: -999, conversation_id: activeId, role: 'assistant', content: streamContent, model: streamContextRef.current?.model, created_at: new Date().toISOString() } as Message);
    }

    allMsgs.forEach((msg, msgIdx) => {
      if (msg.role === 'user') {
        const task = sortedCanvasTasks[taskIndex++];
        activeNode = {
          id: `node-${msg.id}`,
          prompt: copyableMessageText(msg.content),
          createdAt: msg.created_at,
          status: task?.status === 'failed' ? 'failed' : task?.status === 'processing' ? 'processing' : 'queued',
          images: [],
          assistantText: '',
          model: task?.model || msg.model,
          errorMessage: task?.error_message,
        };
        nodes.push(activeNode);
        return;
      }
      if (msg.role !== 'assistant' || !activeNode) return;
      const msgImages = generatedImages(msg.content).map((img, imgIdx) => ({
        ...img,
        messageId: msg.id,
        messageIndex: msgIdx,
        imageIndex: imgIdx,
        prompt: activeNode?.prompt || '',
        model: msg.model,
      }));
      activeNode.images.push(...msgImages);
      activeNode.model = msg.model || activeNode.model;
      activeNode.assistantText = hasCopyableMessageText(msg.content) ? copyableMessageText(msg.content) : activeNode.assistantText;
      activeNode.status = msgImages.length > 0 || activeNode.assistantText ? 'completed' : activeNode.status;
    });

    if (isActiveConversationStreaming && nodes.length > 0) {
      const latest = nodes[nodes.length - 1];
      if (latest.status !== 'completed' && latest.status !== 'failed') {
        latest.status = canvasTaskStatus === 'processing' ? 'processing' : 'queued';
      }
    }

    return nodes;
  }, [canvasMode, activeId, messages, isActiveConversationStreaming, streamContent, canvasTaskStatus, canvasTasks]);

  const allConversationImages = useMemo<CanvasImage[]>(() => {
    return canvasWorkflowNodes.flatMap(node => node.images);
  }, [canvasWorkflowNodes]);

  // ── handleKeyDown ─────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!selectedPlatform || !selectedModelID) {
        setRetryRequest(null);
        setError(t('playground.select_model_first'));
        return;
      }
      if (confirmedImageEdit) {
        void submitImageEdit();
        return;
      }
      submitRef.current?.();
    }
  }, [confirmedImageEdit, selectedModelID, selectedPlatform, submitImageEdit, t]);

  // ── Remaining callbacks ───────────────────────────────────────────────

  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, []);

  const openConversation = useCallback((id: number) => {
    setActiveId(id);
    setError('');
    setRetryRequest(null);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const regenerateLastResponse = useCallback(() => {
    if (!retryRequest || isStreaming || activeId !== retryRequest.conversationID) return;

    const request = retryRequest;
    setError('');
    setRetryRequest(null);
    void streamAssistantResponse({
      ...request,
      requestMessages: request.requestMessages.map(msg => ({ ...msg })),
    });
  }, [activeId, isStreaming, retryRequest, streamAssistantResponse]);

  const regenerateUnfinishedResponse = useCallback(() => {
    if (isStreaming || !activeId || activeId === DRAFT_CONVERSATION_ID) return;
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role !== 'user') return;

    const requestModel = lastUserMessage.model || activeConv?.model || selectedModelID;
    const requestPlatform = lastUserMessage.platform || activeConv?.platform || selectedPlatform;
    if (!requestModel || !requestPlatform) {
      setError('Model required');
      return;
    }

    const requestModelInfo = models.find(item => item.id === requestModel && item.platform === requestPlatform) || models.find(item => item.id === requestModel);
    const isImageRequest = isImageModel(requestModelInfo);
    const shouldUseReasoning = supportsReasoning(requestModelInfo) || Boolean(lastUserMessage.reasoning_effort);
    setError('');
    setRetryRequest(null);
    if (isImageRequest) {
      setIsStreaming(true);
      setStreamConversationId(activeId);
      streamContextRef.current = { conversationId: activeId, model: requestModel };
      void (async () => {
        try {
          const task = await api.createGenerationTask({
            conversation_id: activeId,
            kind: 'image',
            operation: 'generate',
            platform: requestPlatform,
            model: requestModel,
            prompt: stripImagePlannerNoise(lastUserMessage.content) || '根据上一条消息生成图像。',
            group_id: lastUserMessage.group_id || activeConv?.group_id || resolveGroupID(),
            parameters: resolvedImageSize ? { size: resolvedImageSize } : undefined,
            client_context: { persist_user_message: false },
          });
          await pollGenerationTask(task.id, activeId);
          api.getUserInfo().then(setUserInfo).catch(() => {});
        } catch (e) {
          if (activeIdRef.current === activeId) {
            setError(e instanceof Error ? e.message : 'generation failed');
          }
        } finally {
          if (activeIdRef.current === activeId) {
            setIsStreaming(false);
            setStreamContent('');
            setStreamReasoning('');
            setStreamConversationId(null);
            streamContextRef.current = null;
          }
        }
      })();
      return;
    }
    void streamAssistantResponse({
      conversationID: activeId,
      requestMessages: messages.map(msg => ({ ...msg })),
      model: requestModel,
      groupID: lastUserMessage.group_id || activeConv?.group_id || resolveGroupID(),
      platform: requestPlatform,
      supportsReasoning: shouldUseReasoning,
      reasoningEffort: lastUserMessage.reasoning_effort || reasoningEffort,
    });
  }, [activeConv, activeId, isStreaming, messages, models, pollGenerationTask, reasoningEffort, resolveGroupID, resolvedImageSize, selectedModelID, selectedPlatform, streamAssistantResponse]);

  const handleImagePreview = useCallback((url: string, alt: string, imageIndex = 0) => {
    setPreviewImage({ images: [{ url, alt }], index: imageIndex });
  }, []);

  const handleImageDownload = useCallback((url: string, alt: string) => {
    void downloadImage(url, alt)
      .then(() => setInteractionNotice(t('playground.download_started')))
      .catch(() => setInteractionNotice(t('playground.download_failed')));
  }, [t]);

  const showImagePreview = useCallback((images: PreviewImage[], index: number) => {
    if (!images.length) return;
    setPreviewImage({ images, index: clampNumber(index, 0, images.length - 1) });
  }, []);

  const regenerateImage = useCallback((messageIndex: number, imageIndex: number) => {
    if (isStreaming || !activeId || activeId === DRAFT_CONVERSATION_ID) return;

    const sourceIndex = messages.slice(0, messageIndex).map(msg => msg.role).lastIndexOf('user');
    if (sourceIndex < 0) {
      setRetryRequest(null);
      setError(t('playground.no_image_prompt'));
      return;
    }

    const sourceMessage = messages[sourceIndex];
    const assistantMessage = messages[messageIndex];
    if (!assistantMessage) {
      setError(t('playground.no_image_prompt'));
      return;
    }
    const images = generatedImages(assistantMessage.content);
    if (!images[imageIndex]) {
      setError(t('playground.no_image_prompt'));
      return;
    }

    const requestModel = assistantMessage.model || selectedModelID;
    const requestPlatform = assistantMessage.platform || sourceMessage.platform || selectedPlatform;
    if (!requestModel || !requestPlatform) {
      setError('Model required');
      return;
    }

    const retryPrompt = [
      `Regenerate only image ${imageIndex + 1} of ${images.length}.`,
      'Generate exactly one standalone replacement image for this slot.',
      'Do not create a collage, grid, contact sheet, split-screen, infographic, or multi-panel layout.',
      'Original request:',
      stripImagePlannerNoise(sourceMessage.content),
    ].filter(Boolean).join('\n\n');

    setError('');
    setRetryRequest(null);
    setRegeneratingImage({ messageID: assistantMessage.id, imageIndex });
    setInteractionNotice(t('playground.regenerating_image', { defaultValue: 'Regenerating image…' }));
    setIsStreaming(true);
    setStreamConversationId(activeId);
    streamContextRef.current = { conversationId: activeId, model: requestModel };
    setStreamContent('');
    setStreamReasoning('');

    const abort = new AbortController();
    abortRef.current = abort;

    void (async () => {
      try {
        const task = await api.createGenerationTask({
          conversation_id: activeId,
          kind: 'image',
          operation: 'generate',
          platform: requestPlatform,
          model: requestModel,
          prompt: retryPrompt,
          group_id: assistantMessage.group_id || sourceMessage.group_id || resolveGroupID(),
          parameters: resolvedImageSize ? { size: resolvedImageSize } : undefined,
          client_context: { persist_user_message: false },
        });
        if (abort.signal.aborted) return;
        const msgs = await api.listMessages(activeId);
        if (activeIdRef.current === activeId) {
          setMessages(msgs);
        }
        await pollGenerationTask(task.id, activeId);
        if (activeIdRef.current === activeId) {
          setInteractionNotice(t('playground.image_regenerated', { defaultValue: 'Image regenerated' }));
          api.getUserInfo().then(setUserInfo).catch(() => {});
        }
      } catch (err) {
        if (activeIdRef.current === activeId && err instanceof Error) {
          setError(err.message);
        }
      } finally {
        if (activeIdRef.current === activeId) {
          setStreamContent('');
          setStreamReasoning('');
          setStreamConversationId(null);
          streamContextRef.current = null;
          setRegeneratingImage(null);
          setIsStreaming(false);
        }
      }
    })();
  }, [activeId, isStreaming, messages, pollGenerationTask, resolveGroupID, resolvedImageSize, selectedPlatform, selectedModelID, t]);

  const handleMessageCopy = useCallback((content: string) => {
    void copyText(content)
      .then(() => setInteractionNotice('Message copied'))
      .catch(() => setInteractionNotice('Copy failed'));
  }, []);

  // ── Canvas pan/zoom callbacks ─────────────────────────────────────────

  const handleCanvasWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCanvasZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  const handleCanvasPanStart = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.pg-canvas-card')) return;
    canvasPanningRef.current = { startX: e.clientX, startY: e.clientY, panX: canvasPan.x, panY: canvasPan.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [canvasPan]);

  const handleCanvasPanMove = useCallback((e: React.PointerEvent) => {
    if (!canvasPanningRef.current) return;
    const { startX, startY, panX, panY } = canvasPanningRef.current;
    setCanvasPan({ x: panX + (e.clientX - startX), y: panY + (e.clientY - startY) });
  }, []);

  const handleCanvasPanEnd = useCallback(() => {
    canvasPanningRef.current = null;
  }, []);

  const resetCanvasView = useCallback(() => {
    setCanvasZoom(1);
    setCanvasPan({ x: 0, y: 0 });
  }, []);

  // ── interactiveMessageOptions ─────────────────────────────────────────

  const interactiveMessageOptions = useMemo(() => ({
    onImagePreview: handleImagePreview,
    imagePreviewTitle: t('playground.preview_image'),
    generatedImageAlt: t('playground.generated_image'),
    isMobile,
  }), [handleImagePreview, isMobile, t]);

  // ── Build context value ───────────────────────────────────────────────

  const value: PlaygroundContextValue = {
    t: t as PlaygroundContextValue['t'],

    // Conversations
    conversations,
    setConversations,
    conversationsLoaded,
    activeId,
    setActiveId,
    messages,
    setMessages,
    setMessagesRaw,

    // Streaming
    isStreaming,
    setIsStreaming,
    streamContent,
    setStreamContent,
    streamReasoning,
    setStreamReasoning,
    streamConversationId,
    setStreamConversationId,

    // Model & platform
    selectedModel,
    setSelectedModel,
    platforms,
    models,
    selectedModelInfo,
    selectedModelID,
    selectedPlatform,
    selectedModelIsImage,
    selectedModelSupportsReasoning,
    resolvedImageSize,
    modelOptions,
    chatModelOptions,
    imageModelOptions,
    platformNameById,

    // Input
    input,
    setInput,
    pendingImages,
    setPendingImages,

    // Edit panel
    editSource,
    setEditSource,
    confirmedImageEdit,
    setConfirmedImageEdit,
    isEditPanelOpen,
    setIsEditPanelOpen,
    isEditingImage,
    setIsEditingImage,
    editSelection,
    setEditSelection,
    draftEditSelection,
    setDraftEditSelection,
    editStageSize,
    setEditStageSize,

    // Errors & notices
    error,
    setError,
    retryRequest,
    setRetryRequest,
    interactionNotice,
    setInteractionNotice,
    previewImage,
    setPreviewImage,
    regeneratingImage,
    setRegeneratingImage,

    // User & settings
    userInfo,
    setUserInfo,
    reasoningEffort,
    setReasoningEffort,
    thinkingVisible,
    setThinkingVisible,
    imageSizeSettings,
    openSelectId,
    setOpenSelectId,

    // Layout
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    canvasMode,
    setCanvasMode,
    studioMode,
    setStudioMode,

    // Hover
    hoveredCopyTarget,
    setHoveredCopyTarget,

    // Refs
    inputRef,
    fileInputRef,
    editFileInputRef,
    messagesAreaRef,
    messagesEndRef,
    abortRef,
    activeIdRef,
    streamContextRef,
    blobUrlRegistryRef,
    pendingRefocusRef,
    skipNextMessagesLoadRef,
    chatActiveIdRef,
    editCanvasRef,
    editCanvasContainerRef,
    selectionStartRef,
    submitRef,

    // Canvas
    canvasTaskStatus,
    canvasTasks,
    setCanvasTasks,
    expandedPromptNodeId,
    setExpandedPromptNodeId,
    canvasZoom,
    setCanvasZoom,
    canvasPan,
    setCanvasPan,
    canvasPanningRef,
    canvasContainerRef,

    // Computed
    sidebarConversations,
    canvasConversations,
    activeConv,
    isActiveConversationStreaming,
    canSendMessage,
    lastMessage,
    hasRecoverableUserMessage,
    canvasWorkflowNodes,
    allConversationImages,
    interactiveMessageOptions,

    // Callbacks
    resolveGroupID,
    updateImageSizeSettings,
    createConversation,
    createCanvasConversation,
    openCanvasConversation,
    deleteConversation,
    streamAssistantResponse,
    sendMessage,
    sendCanvasMessage,
    pollGenerationTask,
    regenerateCanvasNode,
    addImageFiles,
    handleImageChange,
    handleEditImageChange,
    selectEditImage,
    editGeneratedImage,
    triggerImagePicker,
    triggerEditImagePicker,
    openPendingImageForEdit,
    clearEditSelection,
    cancelEditPanel,
    confirmEditSelection,
    submitImageEdit,
    handlePaste,
    removePendingImage,
    stopStreaming,
    handleKeyDown,
    autoResize,
    handleImagePreview,
    handleImageDownload,
    showImagePreview,
    showNextPreviewImage,
    regenerateLastResponse,
    regenerateUnfinishedResponse,
    regenerateImage,
    handleMessageCopy,
    openConversation,
    handleCanvasWheel,
    handleCanvasPanStart,
    handleCanvasPanMove,
    handleCanvasPanEnd,
    resetCanvasView,
    selectionPointFromEvent,
    handleSelectionPointerDown,
    handleSelectionPointerMove,
    finishSelectionDrag,
    createEditMaskBlob,

    // Rendering helpers
    renderCustomSelect,

    // Derived scalars
    visibleEditSelection,
    isEditSelectionConfirmable,
  };

  return (
    <PlaygroundContext.Provider value={value}>
      {children}
    </PlaygroundContext.Provider>
  );
}
