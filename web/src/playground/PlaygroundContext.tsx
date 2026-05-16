import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { api, chatCompletionsStream } from '../api';
import type {
  BlobUrlRegistry,
  Conversation,
  ImagePreviewState,
  Message,
  MessageContentOptions,
  ModelInfo,
  PendingImage,
  ReasoningEffort,
  RetryRequest,
  SelectOption,
  StreamAssistantOptions,
  UserInfo,
} from './types';
import {
  ACTIVE_CONVERSATION_STORAGE_KEY,
  DRAFT_CONVERSATION_ID,
  MOBILE_BREAKPOINT,
  SELECTED_MODEL_STORAGE_KEY,
  THINKING_VISIBLE_STORAGE_KEY,
} from './constants';
import {
  copyText,
  defaultModelOptionValue,
  getStoredActiveConversationId,
  getStoredSelectedModel,
  imagesFromFiles,
  messageContentWithImages,
  modelOptionValue,
  readLocalStorageValue,
  replaceBase64WithBlobUrls,
  replaceBlobUrlsWithBase64,
  revokeBlobRegistry,
  supportsReasoning,
  titleFromMessageContent,
  toChatMessageContent,
  writeLocalStorageValue,
} from './utils';
import { styles } from './styles';
import { CHAT_MODEL_REGISTRY } from './modelConfig';

declare global {
  interface Window {
    airgate?: {
      confirm?: (message: string, options?: { title?: string; danger?: boolean }) => Promise<boolean>;
    };
  }
}

export interface PlaygroundContextValue {
  t: (key: string, options?: Record<string, unknown>) => string;

  conversations: Conversation[];
  sidebarConversations: Conversation[];
  activeId: number | null;
  messages: Message[];
  isStreaming: boolean;
  streamContent: string;
  streamReasoning: string;
  streamConversationId: number | null;
  isActiveConversationStreaming: boolean;
  hasRecoverableUserMessage: boolean;

  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  selectedModelInfo: ModelInfo | undefined;
  selectedModelID: string;
  selectedPlatform: string;
  selectedModelSupportsReasoning: boolean;
  modelOptions: SelectOption[];

  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  pendingImages: PendingImage[];
  canSendMessage: boolean;

  error: string;
  retryRequest: RetryRequest | null;
  interactionNotice: string;
  previewImage: ImagePreviewState | null;
  setPreviewImage: React.Dispatch<React.SetStateAction<ImagePreviewState | null>>;
  userInfo: UserInfo | null;
  reasoningEffort: ReasoningEffort;
  setReasoningEffort: React.Dispatch<React.SetStateAction<ReasoningEffort>>;
  thinkingVisible: boolean;
  setThinkingVisible: React.Dispatch<React.SetStateAction<boolean>>;

  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  hoveredCopyTarget: string | null;
  setHoveredCopyTarget: React.Dispatch<React.SetStateAction<string | null>>;

  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  messagesAreaRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;

  createConversation: () => void;
  openConversation: (id: number) => void;
  deleteConversation: (id: number) => Promise<void>;
  sendMessage: () => void;
  stopStreaming: () => void;
  regenerateLastResponse: () => void;
  regenerateUnfinishedResponse: () => void;
  handleMessageCopy: (content: string) => void;
  showImagePreview: (images: Array<{ url: string; alt: string }>, index: number) => void;
  showNextPreviewImage: (direction: number) => void;
  removePendingImage: (id: string) => void;
  triggerImagePicker: () => void;
  handleImageChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handlePaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  autoResize: (target: HTMLTextAreaElement) => void;
  renderCustomSelect: (props: {
    id: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    ariaLabel: string;
    style?: CSSProperties;
  }) => ReactNode;
  interactiveMessageOptions: MessageContentOptions;
}

const PlaygroundContext = createContext<PlaygroundContextValue | null>(null);

export function usePlayground() {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) throw new Error('usePlayground must be used within PlaygroundProvider');
  return ctx;
}

export function PlaygroundProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessagesRaw] = useState<Message[]>([]);
  const [streamConversationId, setStreamConversationId] = useState<number | null>(null);
  const [streamContent, setStreamContent] = useState('');
  const [streamReasoning, setStreamReasoning] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [selectedModel, setSelectedModel] = useState(() => {
    const storedModel = getStoredSelectedModel();
    return CHAT_MODEL_REGISTRY.some(model => modelOptionValue(model) === storedModel)
      ? storedModel
      : defaultModelOptionValue(CHAT_MODEL_REGISTRY);
  });
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>('medium');
  const [thinkingVisible, setThinkingVisible] = useState(() => readLocalStorageValue(THINKING_VISIBLE_STORAGE_KEY) !== '0');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState('');
  const [retryRequest, setRetryRequest] = useState<RetryRequest | null>(null);
  const [interactionNotice, setInteractionNotice] = useState('');
  const [previewImage, setPreviewImage] = useState<ImagePreviewState | null>(null);
  const [hoveredCopyTarget, setHoveredCopyTarget] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false
  ));

  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeIdRef = useRef<number | null>(null);
  const skipNextMessagesLoadRef = useRef<number | null>(null);
  const pendingRefocusRef = useRef(false);
  const blobUrlRegistryRef = useRef<BlobUrlRegistry>(new Map());

  const setMessages = useCallback<typeof setMessagesRaw>((arg) => {
    const transform = (items: Message[]) =>
      items.map(msg => {
        if (!msg.content || !msg.content.includes('data:image/')) return msg;
        return { ...msg, content: replaceBase64WithBlobUrls(msg.content, blobUrlRegistryRef.current) };
      });
    if (typeof arg === 'function') {
      setMessagesRaw(prev => transform(arg(prev)));
    } else {
      setMessagesRaw(transform(arg));
    }
  }, []);

  const selectedModelInfo = useMemo(
    () => CHAT_MODEL_REGISTRY.find(item => modelOptionValue(item) === selectedModel),
    [selectedModel],
  );
  const selectedModelID = selectedModelInfo?.id || '';
  const selectedPlatform = selectedModelInfo?.platform || '';
  const selectedModelSupportsReasoning = supportsReasoning(selectedModelInfo);

  const modelOptions = useMemo(() => {
    return CHAT_MODEL_REGISTRY
      .map(model => ({
        value: modelOptionValue(model),
        label: `${model.name || model.id} · ${model.platform}`,
      }));
  }, []);

  const sidebarConversations = useMemo(
    () => conversations.filter(item => item.id !== DRAFT_CONVERSATION_ID),
    [conversations],
  );
  const activeConversation = useMemo(
    () => conversations.find(item => item.id === activeId),
    [activeId, conversations],
  );
  const isActiveConversationStreaming = isStreaming && streamConversationId === activeId;
  const hasRecoverableUserMessage = Boolean(
    activeId &&
    !isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === 'user',
  );
  const canSendMessage = Boolean(
    selectedPlatform &&
    selectedModelID &&
    !isStreaming &&
    (input.trim() || pendingImages.length > 0),
  );

  const resolveGroupID = useCallback(() => activeConversation?.group_id || 0, [activeConversation?.group_id]);

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
    }).catch(() => setConversationsLoaded(true));

    api.getUserInfo().then(setUserInfo).catch(() => {});
  }, []);

  useEffect(() => {
    activeIdRef.current = activeId;
    if (!conversationsLoaded) return;
    if (activeId && activeId !== DRAFT_CONVERSATION_ID) {
      writeLocalStorageValue(ACTIVE_CONVERSATION_STORAGE_KEY, String(activeId));
    } else {
      writeLocalStorageValue(ACTIVE_CONVERSATION_STORAGE_KEY, null);
    }
  }, [activeId, conversationsLoaded]);

  useEffect(() => {
    if (selectedModel && CHAT_MODEL_REGISTRY.some(item => modelOptionValue(item) === selectedModel)) {
      writeLocalStorageValue(SELECTED_MODEL_STORAGE_KEY, selectedModel);
    } else {
      writeLocalStorageValue(SELECTED_MODEL_STORAGE_KEY, null);
    }
  }, [selectedModel]);

  useEffect(() => {
    writeLocalStorageValue(THINKING_VISIBLE_STORAGE_KEY, thinkingVisible ? null : '0');
  }, [thinkingVisible]);

  useEffect(() => {
    if (!activeId || activeId === DRAFT_CONVERSATION_ID) {
      setMessages([]);
      return;
    }
    if (skipNextMessagesLoadRef.current === activeId) {
      skipNextMessagesLoadRef.current = null;
      return;
    }
    api.listMessages(activeId).then(setMessages).catch(err => {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    });
  }, [activeId, setMessages]);

  useEffect(() => {
    const registry = blobUrlRegistryRef.current;
    return () => revokeBlobRegistry(registry);
  }, []);

  useEffect(() => {
    const messagesArea = messagesAreaRef.current;
    if (!messagesArea) return;
    messagesArea.scrollTo({ top: messagesArea.scrollHeight, behavior: 'smooth' });
  }, [messages, streamContent, streamReasoning]);

  useEffect(() => {
    if (!isStreaming && pendingRefocusRef.current) {
      pendingRefocusRef.current = false;
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isStreaming]);

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

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (!interactionNotice) return;
    const timer = window.setTimeout(() => setInteractionNotice(''), 1400);
    return () => window.clearTimeout(timer);
  }, [interactionNotice]);

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
    setConversations(prev => [draft, ...prev.filter(item => item.id !== DRAFT_CONVERSATION_ID)]);
    setActiveId(DRAFT_CONVERSATION_ID);
    setMessages([]);
    setPendingImages([]);
    setError('');
    setRetryRequest(null);
    if (isMobile) setSidebarOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isMobile, resolveGroupID, selectedModelID, selectedPlatform, setMessages, userInfo?.id]);

  const openConversation = useCallback((id: number) => {
    setActiveId(id);
    setPendingImages([]);
    setError('');
    setRetryRequest(null);
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const deleteConversation = useCallback(async (id: number) => {
    const confirmed = await window.airgate?.confirm?.(t('playground.delete_conversation_confirm'), {
      title: t('playground.delete_conversation'),
      danger: true,
    });
    if (!confirmed) return;

    if (id === DRAFT_CONVERSATION_ID) {
      setConversations(prev => prev.filter(item => item.id !== id));
    } else {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(item => item.id !== id));
    }
    if (activeIdRef.current === id) {
      setActiveId(null);
      setMessages([]);
    }
  }, [setMessages, t]);

  const finishStreaming = useCallback(() => {
    setIsStreaming(false);
    setStreamContent('');
    setStreamReasoning('');
    setStreamConversationId(null);
    abortRef.current = null;
  }, []);

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
    setStreamContent('');
    setStreamReasoning('');

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

    const fail = (message: string) => {
      if (activeIdRef.current === conversationID) {
        setError(message);
        setRetryRequest(nextRetryRequest);
      }
      finishStreaming();
    };

    try {
      await chatCompletionsStream(
        platform,
        baseRequest,
        {
          onData: (text) => {
            accumulated += replaceBase64WithBlobUrls(text, blobUrlRegistryRef.current);
            setStreamContent(accumulated);
          },
          onReasoning: (text) => {
            accumulatedReasoning += text;
            setStreamReasoning(accumulatedReasoning);
          },
          onDone: async (usage) => {
            if (!accumulated) {
              fail(t('playground.no_response'));
              return;
            }
            const persisted = await api.persistMessage({
              conversation_id: conversationID,
              role: 'assistant',
              content: replaceBlobUrlsWithBase64(accumulated, blobUrlRegistryRef.current),
              reasoning: accumulatedReasoning,
              platform,
              model: usage.model || model,
              group_id: groupID,
              input_tokens: usage.input_tokens,
              output_tokens: usage.output_tokens,
              cost: usage.cost,
            });
            if (activeIdRef.current === conversationID) {
              setMessages(prev => [...prev, { ...persisted, content: accumulated }]);
            }
            if (titleContent) {
              setConversations(prev => prev.map(item =>
                item.id === conversationID && !item.title
                  ? { ...item, title: titleFromMessageContent(titleContent), updated_at: new Date().toISOString() }
                  : item,
              ));
            }
            api.getUserInfo().then(setUserInfo).catch(() => {});
            setRetryRequest(null);
            finishStreaming();
          },
          onError: fail,
        },
        abort.signal,
      );
    } catch (err) {
      if (abort.signal.aborted) return;
      fail(err instanceof Error ? err.message : 'stream failed');
    }
  }, [finishStreaming, reasoningEffort, setMessages, t]);

  const sendMessage = useCallback(() => {
    void (async () => {
      if (!canSendMessage || !activeId) return;
      pendingRefocusRef.current = true;
      const content = messageContentWithImages(input, pendingImages);
      const groupID = resolveGroupID();
      let conversationID = activeId;
      const localUserMessage: Message = {
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
      };
      const requestMessages = [...messages, localUserMessage];

      setInput('');
      setPendingImages([]);
      if (inputRef.current) inputRef.current.style.height = '24px';
      if (fileInputRef.current) fileInputRef.current.value = '';
      setError('');
      setRetryRequest(null);
      setMessages(requestMessages);

      try {
        if (conversationID === DRAFT_CONVERSATION_ID) {
          const conv = await api.createConversation({
            title: '',
            group_id: groupID,
            platform: selectedPlatform,
            model: selectedModelID,
          });
          conversationID = conv.id;
          if (activeIdRef.current === DRAFT_CONVERSATION_ID) {
            skipNextMessagesLoadRef.current = conv.id;
            setActiveId(conv.id);
            setMessages(prev => prev.map(msg => ({ ...msg, conversation_id: conv.id })));
          }
          setConversations(prev => [conv, ...prev.filter(item => item.id !== DRAFT_CONVERSATION_ID)]);
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
      } catch (err) {
        if (activeIdRef.current === conversationID || activeIdRef.current === DRAFT_CONVERSATION_ID) {
          setError(err instanceof Error ? err.message : 'stream failed');
        }
        finishStreaming();
      }
    })();
  }, [
    activeId,
    canSendMessage,
    finishStreaming,
    input,
    messages,
    pendingImages,
    reasoningEffort,
    resolveGroupID,
    selectedModelID,
    selectedModelSupportsReasoning,
    selectedPlatform,
    setMessages,
    streamAssistantResponse,
  ]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    finishStreaming();
  }, [finishStreaming]);

  const regenerateLastResponse = useCallback(() => {
    if (!retryRequest || isStreaming) return;
    void streamAssistantResponse(retryRequest);
  }, [isStreaming, retryRequest, streamAssistantResponse]);

  const regenerateUnfinishedResponse = useCallback(() => {
    if (!activeId || isStreaming) return;
    const lastUserIndex = [...messages].map(msg => msg.role).lastIndexOf('user');
    if (lastUserIndex < 0) return;
    const requestMessages = messages.slice(0, lastUserIndex + 1);
    const lastUser = requestMessages[requestMessages.length - 1];
    const model = lastUser.model || selectedModelID;
    const platform = lastUser.platform || selectedPlatform;
    if (!model || !platform) {
      setError(t('playground.select_model_first'));
      return;
    }
    void streamAssistantResponse({
      conversationID: activeId,
      requestMessages,
      model,
      groupID: lastUser.group_id || resolveGroupID(),
      platform,
      supportsReasoning: selectedModelSupportsReasoning,
      reasoningEffort,
    });
  }, [
    activeId,
    isStreaming,
    messages,
    reasoningEffort,
    resolveGroupID,
    selectedModelID,
    selectedModelSupportsReasoning,
    selectedPlatform,
    streamAssistantResponse,
    t,
  ]);

  const addImageFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const nextImages = await imagesFromFiles(files);
    if (!nextImages.length) return;
    setPendingImages(prev => [...prev, ...nextImages]);
    setError('');
    setRetryRequest(null);
  }, []);

  const handleImageChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await addImageFiles(Array.from(event.target.files || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read image');
    } finally {
      event.target.value = '';
    }
  }, [addImageFiles]);

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files || []).filter(file => file.type.startsWith('image/'));
    if (!files.length) return;
    event.preventDefault();
    void addImageFiles(files).catch(err => {
      setError(err instanceof Error ? err.message : 'Failed to read image');
    });
  }, [addImageFiles]);

  const removePendingImage = useCallback((id: string) => {
    setPendingImages(prev => prev.filter(item => item.id !== id));
  }, []);

  const triggerImagePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const autoResize = useCallback((target: HTMLTextAreaElement) => {
    target.style.height = '24px';
    target.style.height = `${Math.min(target.scrollHeight, 220)}px`;
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    sendMessage();
  }, [sendMessage]);

  const handleMessageCopy = useCallback((content: string) => {
    void copyText(content)
      .then(() => setInteractionNotice(t('playground.copied', { defaultValue: 'Copied' })))
      .catch(() => setInteractionNotice(t('playground.copy_failed', { defaultValue: 'Copy failed' })));
  }, [t]);

  const showImagePreview = useCallback((images: Array<{ url: string; alt: string }>, index: number) => {
    if (!images.length) return;
    const safeIndex = Math.max(0, Math.min(index, images.length - 1));
    setPreviewImage({ images, index: safeIndex });
  }, []);

  const showNextPreviewImage = useCallback((direction: number) => {
    setPreviewImage(current => {
      if (!current || current.images.length <= 1) return current;
      const next = (current.index + direction + current.images.length) % current.images.length;
      return { ...current, index: next };
    });
  }, []);

  const renderCustomSelect = useCallback(({
    id,
    value,
    options,
    onChange,
    ariaLabel,
    style,
  }: {
    id: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    ariaLabel: string;
    style?: CSSProperties;
  }) => (
    <select
      id={id}
      value={value}
      onChange={event => onChange(event.target.value)}
      aria-label={ariaLabel}
      style={{ ...styles.selectTrigger, minWidth: 180, appearance: 'auto', ...style }}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  ), []);

  const interactiveMessageOptions = useMemo<MessageContentOptions>(() => ({
    imagePreviewTitle: t('playground.preview_image'),
    generatedImageAlt: t('playground.generated_image'),
    isMobile,
  }), [isMobile, t]);

  const value: PlaygroundContextValue = {
    t: t as PlaygroundContextValue['t'],
    conversations,
    sidebarConversations,
    activeId,
    messages,
    isStreaming,
    streamContent,
    streamReasoning,
    streamConversationId,
    isActiveConversationStreaming,
    hasRecoverableUserMessage,
    selectedModel,
    setSelectedModel,
    selectedModelInfo,
    selectedModelID,
    selectedPlatform,
    selectedModelSupportsReasoning,
    modelOptions,
    input,
    setInput,
    pendingImages,
    canSendMessage,
    error,
    retryRequest,
    interactionNotice,
    previewImage,
    setPreviewImage,
    userInfo,
    reasoningEffort,
    setReasoningEffort,
    thinkingVisible,
    setThinkingVisible,
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    hoveredCopyTarget,
    setHoveredCopyTarget,
    inputRef,
    fileInputRef,
    messagesAreaRef,
    messagesEndRef,
    createConversation,
    openConversation,
    deleteConversation,
    sendMessage,
    stopStreaming,
    regenerateLastResponse,
    regenerateUnfinishedResponse,
    handleMessageCopy,
    showImagePreview,
    showNextPreviewImage,
    removePendingImage,
    triggerImagePicker,
    handleImageChange,
    handlePaste,
    handleKeyDown,
    autoResize,
    renderCustomSelect,
    interactiveMessageOptions,
  };

  return <PlaygroundContext.Provider value={value}>{children}</PlaygroundContext.Provider>;
}
