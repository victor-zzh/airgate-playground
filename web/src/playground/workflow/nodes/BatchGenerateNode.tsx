import { memo } from 'react';
import { useReactFlow, useEdges } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { BaseNode } from './BaseNode';
import { workflowStyles as ws } from '../styles';
import type { WorkflowNodeData } from '../types';

type Props = { id: string; data: WorkflowNodeData & Record<string, unknown>; selected?: boolean };

const SIZE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: '1024x1024', label: '1024 × 1024' },
  { value: '1536x1024', label: '1536 × 1024' },
  { value: '1024x1536', label: '1024 × 1536' },
  { value: '2048x2048', label: '2048 × 2048' },
];

export const BatchGenerateNode = memo(function BatchGenerateNode({ id, data, selected }: Props) {
  const { t } = useTranslation();
  const { setNodes } = useReactFlow();
  const edges = useEdges();

  const isPromptConnected = edges.some(e => e.target === id && e.targetHandle === 'prompt');

  const updateValue = (key: string, value: unknown) => {
    setNodes(nds =>
      nds.map(n =>
        n.id === id ? { ...n, data: { ...n.data, values: { ...(n.data as WorkflowNodeData).values, [key]: value } } } : n,
      ),
    );
  };

  const count = (data.values?.count as number) ?? 4;
  const size = (data.values?.size as string) ?? 'auto';
  const prompt = (data.values?.prompt as string) ?? '';

  return (
    <BaseNode id={id} data={data} selected={selected}>
      <div style={{ padding: '4px 12px 8px' }}>
        {!isPromptConnected && (
          <textarea
            style={{ ...ws.nodeTextarea, marginBottom: 6 }}
            value={prompt}
            placeholder={t('playground.wf_prompt_placeholder')}
            onChange={e => updateValue('prompt', e.target.value)}
            className="nodrag"
          />
        )}
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <div style={{ flex: '0 0 72px' }}>
            <div style={{ fontSize: 10, color: 'var(--ag-color-textTertiary, #6b7280)', marginBottom: 2 }}>Count</div>
            <input
              style={ws.nodeInput}
              type="number"
              min={1}
              max={8}
              value={count}
              onChange={e => updateValue('count', Math.max(1, Math.min(8, Number(e.target.value))))}
              className="nodrag"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--ag-color-textTertiary, #6b7280)', marginBottom: 2 }}>Size</div>
            <select
              style={ws.nodeSelect}
              value={size}
              onChange={e => updateValue('size', e.target.value)}
              className="nodrag"
            >
              {SIZE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </BaseNode>
  );
});
