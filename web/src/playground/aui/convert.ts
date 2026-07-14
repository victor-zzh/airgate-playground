// Message → ThreadMessageLike 的纯函数映射层（assistant-ui 外部存储 runtime 用）。
//
// 关键取舍：msg.content 整体作为单个 text part 传入，不拆 image/file part——
// <file> 块与图片 markdown 的内容约定由现有渲染管线（MarkdownMessage/MessageRendering）
// 处理；assistant-ui 的 image part sanitizer 会丢掉相对路径资产 URL，绝不能拆。
import type { ThreadMessageLike } from '@assistant-ui/react';
import type { Message, PersistedToolCall } from '../../api';
import { isToolPart, type StreamPart } from './streamState';

// assistant-ui 接受的 content part 精确联合（含 tool-call）。args/result 为
// JSON 值语义，运行时来自后端 JSON，构造处做类型断言即可。
type ThreadContent = Exclude<ThreadMessageLike['content'], string>;
type ThreadContentPart = ThreadContent[number];

// 流式临时消息的固定 id：每轮流式复用同一节点，结束后被持久化消息替换。
export const AUI_STREAMING_MESSAGE_ID = 'aui-streaming';

// 流式中的临时消息（尚未持久化），与 Message 组成 runtime 的源消息联合类型。
export type StreamingDraftMessage = {
  readonly auiStreamingDraft: true;
  readonly parts: readonly StreamPart[];
};

export type AuiSourceMessage = Message | StreamingDraftMessage;

export function isStreamingDraft(msg: AuiSourceMessage): msg is StreamingDraftMessage {
  return 'auiStreamingDraft' in msg;
}

type ThreadMessageLikeContentPart = ThreadContentPart;

function toolCallContentPart(call: {
  id: string;
  name: string;
  args?: unknown;
  result?: Record<string, unknown>;
  error?: string;
  isError?: boolean;
}): ThreadMessageLikeContentPart {
  const args = (call.args && typeof call.args === 'object' ? call.args : {}) as Record<string, unknown>;
  return {
    type: 'tool-call',
    toolCallId: call.id,
    toolName: call.name,
    args: args as never,
    argsText: JSON.stringify(args),
    result: (call.error ? { error: call.error } : call.result) as never,
    isError: call.isError,
  };
}

export function toThreadMessageLike(msg: Message): ThreadMessageLike {
  const content: ThreadMessageLikeContentPart[] = [];
  if (msg.reasoning) content.push({ type: 'reasoning', text: msg.reasoning });
  // 历史恢复顺序契约：reasoning → 全部工具卡片 → text（不还原精确交错）。
  if (msg.tool_calls && msg.tool_calls.length > 0) {
    for (const call of msg.tool_calls) {
      content.push(toolCallContentPart({
        id: call.id,
        name: call.name,
        args: call.args,
        result: call.result,
        error: call.error,
        isError: call.status === 'error',
      }));
    }
  }
  content.push({ type: 'text', text: msg.content });
  return {
    id: String(msg.id),
    role: (msg.role === 'assistant' || msg.role === 'system' ? msg.role : 'user'),
    content,
    createdAt: new Date(msg.created_at),
    metadata: {
      custom: {
        model: msg.model,
        platform: msg.platform,
        cost: msg.cost,
        input_tokens: msg.input_tokens,
        output_tokens: msg.output_tokens,
        ...(msg.reasoning_effort ? { reasoning_effort: msg.reasoning_effort } : {}),
      },
    },
  };
}

export function streamingDraftToThreadMessageLike(draft: StreamingDraftMessage): ThreadMessageLike {
  return {
    id: AUI_STREAMING_MESSAGE_ID,
    role: 'assistant',
    // 流式期间保持 text/tool 精确交错顺序（reducer 维护的 part 顺序）。
    content: draft.parts.map<ThreadMessageLikeContentPart>(part => {
      if (isToolPart(part)) {
        return toolCallContentPart({
          id: part.id,
          name: part.name,
          args: part.args,
          result: part.result,
          error: part.error,
          isError: part.status === 'error',
        });
      }
      return part.kind === 'reasoning'
        ? { type: 'reasoning', text: part.text }
        : { type: 'text', text: part.text };
    }),
    status: { type: 'running' },
    metadata: { custom: { streaming: true } },
  };
}

// persistedToolCallsFromStream：把流式工具 part 转成持久化记录（进 tool_calls 字段）。
export function persistedToolCallsFromStream(parts: readonly StreamPart[]): PersistedToolCall[] {
  return parts.filter(isToolPart).map(part => ({
    id: part.id,
    name: part.name,
    status: part.status === 'error' ? 'error' as const : 'complete' as const,
    args: part.args,
    result: part.result,
    error: part.error,
  }));
}

// 按消息对象引用缓存转换结果：流式期间每个 chunk 都会触发一次全量 convert 调用，
// 历史消息对象引用不变时直接命中缓存，防止逐 chunk 全量重建。
// （runtime 内部的 ThreadMessageConverter 也有一层同样按引用的 WeakMap 缓存，
// 这里的缓存保证我们返回的 ThreadMessageLike 引用稳定，双保险且可单测。）
const conversionCache = new WeakMap<Message, ThreadMessageLike>();

// 注意：此函数必须保持模块级稳定引用——runtime 检测到 convertMessage 引用变化
// 会整体重建转换缓存。
export function convertAuiMessage(msg: AuiSourceMessage): ThreadMessageLike {
  if (isStreamingDraft(msg)) return streamingDraftToThreadMessageLike(msg);
  const cached = conversionCache.get(msg);
  if (cached) return cached;
  const converted = toThreadMessageLike(msg);
  conversionCache.set(msg, converted);
  return converted;
}
