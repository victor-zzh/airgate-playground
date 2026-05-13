import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { BaseNode } from './BaseNode';
import { workflowStyles as ws } from '../styles';
import type { WorkflowNodeData } from '../types';

type Props = { id: string; data: WorkflowNodeData & Record<string, unknown>; selected?: boolean };

export const ConditionalNode = memo(function ConditionalNode({ id, data, selected }: Props) {
  const { t } = useTranslation();
  const { setNodes } = useReactFlow();

  const EXPRESSION_OPTIONS = [
    { value: 'contains', label: t('playground.wf_contains') },
    { value: 'equals', label: t('playground.wf_equals') },
    { value: 'regex', label: t('playground.wf_regex') },
  ];

  const updateValue = (key: string, value: unknown) => {
    setNodes(nds =>
      nds.map(n =>
        n.id === id ? { ...n, data: { ...n.data, values: { ...(n.data as WorkflowNodeData).values, [key]: value } } } : n,
      ),
    );
  };

  const expression = (data.values?.expression as string) ?? 'contains';
  const match = (data.values?.match as string) ?? '';

  return (
    <BaseNode id={id} data={data} selected={selected}>
      <div style={{ padding: '4px 12px 8px' }}>
        <select
          style={{ ...ws.nodeSelect, marginBottom: 6 }}
          value={expression}
          onChange={e => updateValue('expression', e.target.value)}
          className="nodrag"
        >
          {EXPRESSION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          style={ws.nodeInput}
          type="text"
          value={match}
          placeholder={expression === 'regex' ? 'Pattern (e.g. ^hello)' : 'Match value...'}
          onChange={e => updateValue('match', e.target.value)}
          className="nodrag"
        />
      </div>
    </BaseNode>
  );
});
