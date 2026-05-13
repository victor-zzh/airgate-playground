import type { Node, Edge } from '@xyflow/react';

export type PortDataType = 'text' | 'image' | 'number' | 'boolean' | 'any';

export interface PortDefinition {
  id: string;
  label: string;
  dataType: PortDataType;
  required?: boolean;
  multiple?: boolean;
}

export interface NodeTypeDefinition {
  type: string;
  label: string;
  category: 'input' | 'generation' | 'editing' | 'logic' | 'output';
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  defaultData: Record<string, unknown>;
  color: string;
}

export interface WorkflowNodeData extends Record<string, unknown> {
  nodeType: string;
  label: string;
  values: Record<string, unknown>;
  status: 'idle' | 'running' | 'completed' | 'error';
  result?: NodeResult;
  error?: string;
}

export type NodeResult = {
  text?: string;
  images?: Array<{ url: string; alt: string }>;
  number?: number;
  boolean?: boolean;
};

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export interface SerializedWorkflow {
  version: 1;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: WorkflowNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    sourceHandle: string;
    target: string;
    targetHandle: string;
  }>;
  viewport: { x: number; y: number; zoom: number };
}

export interface ExecutionContext {
  platform: string;
  model: string;
  imageSize?: string;
  signal: AbortSignal;
  onNodeStatusChange: (nodeId: string, status: WorkflowNodeData['status'], result?: NodeResult, error?: string) => void;
  conversationId: number;
  groupId: number;
}

export type NodeExecutor = (
  inputs: Record<string, NodeResult>,
  data: WorkflowNodeData,
  context: ExecutionContext,
) => Promise<NodeResult>;
