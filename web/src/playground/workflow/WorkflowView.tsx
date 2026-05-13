import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  type NodeTypes,
  type Connection,
  type ReactFlowInstance,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NODE_TYPES, NODE_CATEGORIES, PORT_COLORS } from './registry';
import { workflowStyles as ws } from './styles';
import { executeWorkflow } from './engine';
import { listWorkflows, loadWorkflow, saveWorkflow, deleteWorkflow, generateWorkflowId } from './persistence';
import type { ExecutionContext, NodeResult, SerializedWorkflow } from './types';
import type { WorkflowNodeData } from './types';
import { TextInputNode } from './nodes/TextInputNode';
import { ImageReferenceNode } from './nodes/ImageReferenceNode';
import { ImageGenerateNode } from './nodes/ImageGenerateNode';
import { ImageEditNode } from './nodes/ImageEditNode';
import { ConditionalNode } from './nodes/ConditionalNode';
import { BatchGenerateNode } from './nodes/BatchGenerateNode';
import { ResizeNode } from './nodes/ResizeNode';
import { MergeNode } from './nodes/MergeNode';

type WfNodeData = WorkflowNodeData & Record<string, unknown>;
type WfEdge = Edge;

const nodeTypes: NodeTypes = {
  text_input: TextInputNode,
  image_reference: ImageReferenceNode,
  image_generate: ImageGenerateNode,
  image_edit: ImageEditNode,
  conditional: ConditionalNode,
  batch_generate: BatchGenerateNode,
  resize: ResizeNode,
  merge: MergeNode,
};

let nodeIdCounter = 0;
function nextNodeId() {
  return `node_${Date.now()}_${nodeIdCounter++}`;
}

const NODE_LABEL_KEYS: Record<string, string> = {
  text_input: 'playground.wf_node_text_input',
  image_reference: 'playground.wf_node_image_reference',
  image_generate: 'playground.wf_node_image_generate',
  image_edit: 'playground.wf_node_image_edit',
  conditional: 'playground.wf_node_conditional',
  batch_generate: 'playground.wf_node_batch_generate',
  resize: 'playground.wf_node_resize',
  merge: 'playground.wf_node_merge',
};

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  input: 'playground.wf_input',
  generation: 'playground.wf_generation',
  editing: 'playground.wf_editing',
  logic: 'playground.wf_logic',
};

export function WorkflowView() {
  const { t } = useTranslation();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WfEdge>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Workflow persistence
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled');
  const [savedWorkflows, setSavedWorkflows] = useState(() => listWorkflows());
  const saveTimerRef = useRef<number | null>(null);

  const doSave = useCallback(() => {
    const id = workflowId || generateWorkflowId();
    if (!workflowId) setWorkflowId(id);
    const data: SerializedWorkflow = {
      version: 1,
      nodes: nodes.map(n => ({ id: n.id, type: n.type || '', position: n.position, data: n.data as any })),
      edges: edges.map(e => ({ id: e.id, source: e.source, sourceHandle: e.sourceHandle || '', target: e.target, targetHandle: e.targetHandle || '' })),
      viewport: { x: 0, y: 0, zoom: 1 },
    };
    saveWorkflow(id, workflowName, data);
    setSavedWorkflows(listWorkflows());
  }, [workflowId, workflowName, nodes, edges]);

  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(doSave, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [nodes, edges, doSave]);

  const handleLoadWorkflow = useCallback((id: string) => {
    const data = loadWorkflow(id);
    if (!data) return;
    setWorkflowId(id);
    const entry = savedWorkflows.find(w => w.id === id);
    setWorkflowName(entry?.name || 'Untitled');
    setNodes(data.nodes.map(n => ({ ...n, data: n.data as any })));
    setEdges(data.edges);
  }, [savedWorkflows, setNodes, setEdges]);

  const handleDeleteWorkflow = useCallback((id: string) => {
    deleteWorkflow(id);
    setSavedWorkflows(listWorkflows());
    if (workflowId === id) {
      setWorkflowId(null);
      setWorkflowName('Untitled');
      setNodes([]);
      setEdges([]);
    }
  }, [workflowId, setNodes, setEdges]);

  const handleNewWorkflow = useCallback(() => {
    setWorkflowId(null);
    setWorkflowName('Untitled');
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => {
        const newEdges = addEdge(connection, eds);
        // Apply styling to the newly added edge (always last)
        const lastEdge = newEdges[newEdges.length - 1];
        if (lastEdge) {
          lastEdge.animated = true;
          lastEdge.style = { stroke: PORT_COLORS.any, strokeWidth: 2 };
        }
        return newEdges;
      });
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/workflow-node-type');
      if (!nodeType || !NODE_TYPES[nodeType]) return;

      const typeDef = NODE_TYPES[nodeType];
      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }) || { x: 0, y: 0 };

      const newNode: Node = {
        id: nextNodeId(),
        type: nodeType,
        position,
        data: {
          nodeType,
          label: t(NODE_LABEL_KEYS[nodeType] || typeDef.label),
          values: { ...typeDef.defaultData },
          status: 'idle',
        },
      };

      setNodes(nds => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes],
  );

  // Quick generate from input box
  const quickGenerate = useCallback((prompt: string) => {
    const textNodeId = nextNodeId();
    const genNodeId = nextNodeId();

    const textNode: Node = {
      id: textNodeId,
      type: 'text_input',
      position: { x: 100, y: 200 },
      data: {
        nodeType: 'text_input',
        label: t('playground.wf_node_text_input'),
        values: { text: prompt },
        status: 'idle',
      },
    };

    const genNode: Node = {
      id: genNodeId,
      type: 'image_generate',
      position: { x: 500, y: 200 },
      data: {
        nodeType: 'image_generate',
        label: t('playground.wf_node_image_generate'),
        values: { size: 'auto' },
        status: 'idle',
      },
    };

    const edge: WfEdge = {
      id: `edge_${textNodeId}_${genNodeId}`,
      source: textNodeId,
      sourceHandle: 'text',
      target: genNodeId,
      targetHandle: 'prompt',
      animated: true,
      style: { stroke: PORT_COLORS.text, strokeWidth: 2 },
    };

    setNodes(nds => [...nds, textNode, genNode]);
    setEdges(eds => [...eds, edge]);
  }, [setNodes, setEdges]);

  // Execution
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runWorkflow = useCallback(async () => {
    if (isRunning || nodes.length === 0) return;
    setIsRunning(true);
    const abort = new AbortController();
    abortRef.current = abort;

    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle', result: undefined, error: undefined } })));

    const context: ExecutionContext = {
      platform: 'openai',
      model: 'gpt-image-2',
      signal: abort.signal,
      conversationId: -1,
      groupId: 0,
      onNodeStatusChange: (nodeId, status, result, error) => {
        setNodes(nds => nds.map(n =>
          n.id === nodeId ? { ...n, data: { ...n.data, status, ...(result ? { result } : {}), ...(error ? { error } : {}) } } : n
        ));
      },
    };

    try {
      await executeWorkflow(nodes, edges, context);
    } catch (err) {
      console.error('[workflow]', err);
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [isRunning, nodes, edges, setNodes]);

  const clearWorkflow = useCallback(() => {
    if (isRunning) {
      abortRef.current?.abort();
      setIsRunning(false);
    }
    setNodes([]);
    setEdges([]);
  }, [isRunning, setNodes, setEdges]);

  // Input state
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = inputValue.trim();
      if (!text) return;
      quickGenerate(text);
      setInputValue('');
    }
  }, [inputValue, quickGenerate]);

  return (
    <div style={ws.layout}>
      {/* Sidebar */}
      <div style={ws.sidebar}>
        <div style={ws.sidebarHeader}>{t('playground.wf_nodes')}</div>
        {NODE_CATEGORIES.map(cat => (
          <div key={cat.id}>
            <div style={ws.sidebarCategory}>{t(CATEGORY_LABEL_KEYS[cat.id] || cat.label)}</div>
            {cat.types.map(type => {
              const def = NODE_TYPES[type];
              return (
                <div
                  key={type}
                  style={ws.sidebarNodeItem}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('application/workflow-node-type', type);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <span style={{ ...ws.sidebarNodeDot, background: def.color }} />
                  {t(NODE_LABEL_KEYS[type] || def.label)}
                </div>
              );
            })}
          </div>
        ))}
        <div style={ws.sidebarDivider} />
        <div style={ws.sidebarHeader}>
          <span>{t('playground.wf_workflows')}</span>
        </div>
        <div style={{ padding: '0 6px 4px' }}>
          <div
            style={{ ...ws.sidebarNodeItem, cursor: 'pointer' }}
            onClick={handleNewWorkflow}
          >
            <span style={{ fontSize: 14, lineHeight: '1' }}>+</span> {t('playground.wf_new_workflow')}
          </div>
        </div>
        <div style={ws.workflowList}>
          {savedWorkflows.map(w => (
            <div
              key={w.id}
              style={{ ...ws.workflowItem, ...(workflowId === w.id ? ws.workflowItemActive : null) }}
              onClick={() => handleLoadWorkflow(w.id)}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
              <button
                type="button"
                style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', padding: 2, opacity: 0.5, fontSize: 11 }}
                onClick={e => { e.stopPropagation(); handleDeleteWorkflow(w.id); }}
                title="Delete"
              >×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div style={ws.canvasArea} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#64748b', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.05)" />
          <Controls
            position="bottom-left"
            style={{ borderRadius: 10, overflow: 'hidden', border: 'none' }}
          />
          <MiniMap
            position="bottom-right"
            style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--ag-color-borderSubtle, #1e293b)' }}
            maskColor="rgba(0,0,0,0.6)"
            nodeColor={n => {
              const d = n.data as unknown as WfNodeData | undefined;
              return NODE_TYPES[d?.nodeType ?? '']?.color || '#64748b';
            }}
          />
        </ReactFlow>

        {/* Toolbar */}
        <div style={ws.toolbar}>
          <button
            type="button"
            style={{ ...ws.toolbarBtn, ...ws.toolbarBtnPrimary, opacity: isRunning || nodes.length === 0 ? 0.5 : 1 }}
            onClick={() => void runWorkflow()}
            disabled={isRunning || nodes.length === 0}
            title="Run workflow"
          >
            {isRunning ? (
              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'pg-spin 0.8s linear infinite' }} />
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
            {isRunning ? t('playground.wf_running') : t('playground.wf_run')}
          </button>
          <button type="button" style={ws.toolbarBtn} onClick={clearWorkflow} title={t('playground.wf_clear')}>{t('playground.wf_clear')}</button>
        </div>

        {/* Quick input */}
        <div style={ws.inputArea}>
          <textarea
            ref={inputRef}
            style={ws.inputTextarea}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t('playground.wf_quick_input_placeholder')}
            rows={1}
          />
          <button
            type="button"
            style={{ ...ws.inputSendBtn, opacity: inputValue.trim() ? 1 : 0.4 }}
            disabled={!inputValue.trim()}
            onClick={() => {
              const text = inputValue.trim();
              if (!text) return;
              quickGenerate(text);
              setInputValue('');
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
