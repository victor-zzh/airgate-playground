import type { NodeTypeDefinition } from './types';

export const NODE_TYPES: Record<string, NodeTypeDefinition> = {
  text_input: {
    type: 'text_input',
    label: 'Text Input',
    category: 'input',
    inputs: [],
    outputs: [{ id: 'text', label: 'Text', dataType: 'text' }],
    defaultData: { text: '' },
    color: '#3b82f6',
  },
  image_reference: {
    type: 'image_reference',
    label: 'Image Reference',
    category: 'input',
    inputs: [],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    defaultData: { url: '', alt: '' },
    color: '#3b82f6',
  },
  image_generate: {
    type: 'image_generate',
    label: 'Image Generate',
    category: 'generation',
    inputs: [
      { id: 'prompt', label: 'Prompt', dataType: 'text', required: true },
      { id: 'size', label: 'Size', dataType: 'text', required: false },
    ],
    outputs: [{ id: 'images', label: 'Images', dataType: 'image' }],
    defaultData: { size: 'auto' },
    color: '#a855f7',
  },
  image_edit: {
    type: 'image_edit',
    label: 'Image Edit',
    category: 'editing',
    inputs: [
      { id: 'image', label: 'Image', dataType: 'image', required: true },
      { id: 'prompt', label: 'Prompt', dataType: 'text', required: true },
    ],
    outputs: [{ id: 'edited_image', label: 'Edited Image', dataType: 'image' }],
    defaultData: { prompt: '' },
    color: '#f97316',
  },
  conditional: {
    type: 'conditional',
    label: 'Conditional',
    category: 'logic',
    inputs: [
      { id: 'condition', label: 'Condition', dataType: 'text', required: true },
      { id: 'input', label: 'Input', dataType: 'any', required: true },
    ],
    outputs: [
      { id: 'true_out', label: 'True', dataType: 'any' },
      { id: 'false_out', label: 'False', dataType: 'any' },
    ],
    defaultData: { expression: 'contains', match: '' },
    color: '#22c55e',
  },
  batch_generate: {
    type: 'batch_generate',
    label: 'Batch Generate',
    category: 'generation',
    inputs: [
      { id: 'prompt', label: 'Prompt', dataType: 'text', required: true },
      { id: 'count', label: 'Count', dataType: 'number', required: false },
      { id: 'size', label: 'Size', dataType: 'text', required: false },
    ],
    outputs: [{ id: 'images', label: 'Images', dataType: 'image' }],
    defaultData: { count: 4, size: 'auto' },
    color: '#a855f7',
  },
  resize: {
    type: 'resize',
    label: 'Resize',
    category: 'editing',
    inputs: [
      { id: 'image', label: 'Image', dataType: 'image', required: true },
      { id: 'width', label: 'Width', dataType: 'number', required: false },
      { id: 'height', label: 'Height', dataType: 'number', required: false },
    ],
    outputs: [{ id: 'resized_image', label: 'Resized', dataType: 'image' }],
    defaultData: { width: 1024, height: 1024, lockAspect: true },
    color: '#f97316',
  },
  merge: {
    type: 'merge',
    label: 'Merge',
    category: 'editing',
    inputs: [
      { id: 'image_a', label: 'Image A', dataType: 'image', required: true },
      { id: 'image_b', label: 'Image B', dataType: 'image', required: true },
      { id: 'layout', label: 'Layout', dataType: 'text', required: false },
    ],
    outputs: [{ id: 'merged_image', label: 'Merged', dataType: 'image' }],
    defaultData: { layout: 'horizontal' },
    color: '#f97316',
  },
};

export const NODE_CATEGORIES = [
  { id: 'input', label: 'Input', types: ['text_input', 'image_reference'] },
  { id: 'generation', label: 'Generation', types: ['image_generate', 'batch_generate'] },
  { id: 'editing', label: 'Editing', types: ['image_edit', 'resize', 'merge'] },
  { id: 'logic', label: 'Logic', types: ['conditional'] },
] as const;

export const PORT_COLORS: Record<string, string> = {
  text: '#22d3ee',
  image: '#e879f9',
  number: '#facc15',
  boolean: '#4ade80',
  any: '#d1d5db',
};
