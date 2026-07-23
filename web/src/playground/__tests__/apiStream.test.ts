import { afterEach, describe, expect, it, vi } from 'vitest';
import { chatCompletionsStream } from '../../api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chatCompletionsStream finish reason', () => {
  it('passes output-limit reason and usage to onDone', async () => {
    const sse = [
      'data: {"choices":[{"index":0,"delta":{"content":"partial"}}]}',
      'data: {"choices":[{"index":0,"delta":{},"finish_reason":"length"}],"airgate":{"stop_reason":"max_tokens"}}',
      'data: {"usage":{"model":"claude-sonnet-5","user_cost":0.28,"metrics":[{"key":"input_tokens","kind":"token","value":12},{"key":"output_tokens","kind":"token","value":32768},{"key":"document_render","kind":"custom","value":1}],"cost_details":[{"key":"document_render","user_cost":0.03}]},"model":"claude-sonnet-5"}',
      'data: [DONE]',
      '',
    ].join('\n');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(sse, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })));

    let text = '';
    let completed: Parameters<Parameters<typeof chatCompletionsStream>[2]['onDone']>[0] | undefined;
    await chatCompletionsStream('claude', {
      model: 'claude-sonnet-5',
      messages: [{ role: 'user', content: 'write' }],
      stream: true,
    }, {
      onData: chunk => { text += chunk; },
      onReasoning: () => {},
      onDone: result => { completed = result; },
      onError: error => { throw new Error(error); },
    });

    expect(text).toBe('partial');
    expect(completed).toEqual({
      input_tokens: 12,
      output_tokens: 32768,
      model: 'claude-sonnet-5',
      cost: 0.28,
      model_cost: 0.25,
      render_fee: 0.03,
      finish_reason: 'length',
      stop_reason: 'max_tokens',
    });
  });
});
