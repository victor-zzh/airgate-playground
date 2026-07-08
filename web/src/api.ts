const BASE = '/api/v1/ext-user/airgate-playground';

function getStoredToken() {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem('token') || '';
  } catch {
    return '';
  }
}

function clearStoredTokenAndRedirect() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('token');
  } catch {
    // Storage can be unavailable in private mode or locked-down browsers.
  }
  window.location.href = '/login';
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getStoredToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T>(method: string, path: string, body?: unknown, base = BASE): Promise<T> {
  const headers: Record<string, string> = { ...authHeaders() };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const resp = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text();
    let msg = `HTTP ${resp.status}`;
    try {
      const j = JSON.parse(text);
      msg = j.error || j.message || msg;
    } catch { /* ignore */ }
    if (resp.status === 401) {
      clearStoredTokenAndRedirect();
    }
    throw new Error(msg);
  }

  const text = await resp.text();
  return text ? JSON.parse(text) as T : null as unknown as T;
}

// ── Types ──

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  group_id: number;
  platform: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
  reasoning?: string;
  reasoning_effort?: ReasoningEffort;
  platform: string;
  model: string;
  group_id: number;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  created_at: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  balance: number;
  status: string;
  api_key_id?: number;
  api_key_name?: string;
  api_key_platform?: string;
}

export interface PersistedMessageRequest {
  conversation_id: number;
  role: string;
  content: string;
  reasoning?: string;
  reasoning_effort?: ReasoningEffort;
  platform?: string;
  model?: string;
  group_id?: number;
  input_tokens?: number;
  output_tokens?: number;
  cost?: number;
}

export type ChatMessageContent = string | Array<
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
>;

export interface ChatCompletionCallbacks {
  onData: (text: string) => void;
  onReasoning: (text: string) => void;
  onDone: (usage: { input_tokens: number; output_tokens: number; model: string; cost: number }) => void | Promise<void>;
  onError: (err: string) => void;
}

// ── API ──

export const api = {
  listConversations: () => request<Conversation[]>('GET', '/conversations'),

  createConversation: (data: { title?: string; group_id?: number; platform?: string; model?: string }) =>
    request<Conversation>('POST', '/conversations', data),

  deleteConversation: (id: number) =>
    request<{ status: string }>('DELETE', `/conversations/${id}`),

  listMessages: (convId: number) => request<Message[]>('GET', `/messages/${convId}`),

  persistMessage: (data: PersistedMessageRequest) => request<Message>('POST', '/messages', data),

  getUserInfo: () => request<UserInfo>('GET', '/user/info'),
};

export async function chatCompletionsStream(
  platform: string,
  body: {
    model: string;
    messages: Array<{ role: string; content: ChatMessageContent }>;
    stream: true;
    reasoning_effort?: ReasoningEffort;
    stream_options?: { include_usage?: boolean };
  },
  callbacks: ChatCompletionCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const requestBody = {
    ...body,
    stream_options: {
      include_usage: true,
      ...body.stream_options,
    },
  };

  const resp = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'X-Airgate-Platform': platform,
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!resp.ok || !resp.body) {
    const text = await resp.text();
    let msg = `HTTP ${resp.status}`;
    try {
      const parsed = JSON.parse(text);
      msg = parsed.error?.message || parsed.error || parsed.message || msg;
    } catch { /* ignore */ }
    if (resp.status === 401) {
      clearStoredTokenAndRedirect();
    }
    callbacks.onError(msg);
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let usage = { input_tokens: 0, output_tokens: 0, model: body.model, cost: 0 };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n');
      buffer = parts.pop() || '';

      for (const line of parts) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          continue;
        }
        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) {
            callbacks.onError(parsed.error.message || parsed.error);
            return;
          }
          const choiceDelta = parsed.choices?.[0]?.delta;
          const reasoningDelta = choiceDelta?.reasoning_content;
          if (reasoningDelta) callbacks.onReasoning(reasoningDelta);
          const delta = choiceDelta?.content;
          if (delta) callbacks.onData(delta);
          if (parsed.usage) usage = normalizeStreamUsage(parsed.usage, parsed.model || usage.model);
        } catch {
          // non-JSON SSE line, skip
        }
      }
    }
    await callbacks.onDone(usage);
  } catch (err) {
    if (signal?.aborted) return;
    callbacks.onError(err instanceof Error ? err.message : 'stream failed');
  }
}

function normalizeStreamUsage(raw: any, fallbackModel: string) {
  const metricValue = (key: string): number => {
    const metric = Array.isArray(raw?.metrics)
      ? raw.metrics.find((item: any) => item?.key === key)
      : undefined;
    const value = Number(metric?.value);
    return Number.isFinite(value) ? value : 0;
  };

  const promptTokens = Number(raw?.prompt_tokens ?? raw?.input_tokens);
  const completionTokens = Number(raw?.completion_tokens ?? raw?.output_tokens);
  const directCost = Number(raw?.cost ?? raw?.user_cost ?? raw?.account_cost);

  return {
    input_tokens: Number.isFinite(promptTokens) ? promptTokens : metricValue('input_tokens'),
    output_tokens: Number.isFinite(completionTokens) ? completionTokens : metricValue('output_tokens'),
    model: String(raw?.model || fallbackModel || ''),
    cost: Number.isFinite(directCost) ? directCost : 0,
  };
}
