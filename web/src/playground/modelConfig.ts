import type { ModelInfo } from './types';

export const CHAT_MODEL_REGISTRY: ModelInfo[] = [
  {
    id: 'gpt-5.5',
    name: 'GPT 5.5',
    platform: 'openai',
    input_price: 5,
    output_price: 30,
    context_window: 400000,
    max_output_tokens: 128000,
    capabilities: ['chat', 'reasoning'],
  },
  {
    id: 'gpt-5.4',
    name: 'GPT 5.4',
    platform: 'openai',
    input_price: 2.5,
    output_price: 15,
    context_window: 272000,
    max_output_tokens: 128000,
    capabilities: ['chat', 'reasoning'],
  },
  {
    id: 'gpt-5.4-mini',
    name: 'GPT 5.4 Mini',
    platform: 'openai',
    input_price: 0.75,
    output_price: 4.5,
    context_window: 128000,
    max_output_tokens: 128000,
    capabilities: ['chat', 'reasoning'],
  },
];
