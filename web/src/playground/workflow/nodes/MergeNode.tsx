import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { BaseNode } from './BaseNode';
import { workflowStyles as ws } from '../styles';
import type { WorkflowNodeData } from '../types';

type Props = { id: string; data: WorkflowNodeData & Record<string, unknown>; selected?: boolean };

export const MergeNode = memo(function MergeNode({ id, data, selected }: Props) {
  const { t } = useTranslation();
  const { setNodes } = useReactFlow();

  const LAYOUT_OPTIONS = [
    { value: 'horizontal', label: t('playground.wf_layout_horizontal') },
    { value: 'vertical', label: t('playground.wf_layout_vertical') },
    { value: 'overlay', label: t('playground.wf_layout_overlay') },
  ];

  const updateValue = (key: string, value: unknown) => {
    setNodes(nds =>
      nds.map(n =>
        n.id === id ? { ...n, data: { ...n.data, values: { ...(n.data as WorkflowNodeData).values, [key]: value } } } : n,
      ),
    );
  };

  const layout = (data.values?.layout as string) ?? 'horizontal';

  return (
    <BaseNode id={id} data={data} selected={selected}>
      <div style={{ padding: '4px 12px 8px' }}>
        <select
          style={ws.nodeSelect}
          value={layout}
          onChange={e => updateValue('layout', e.target.value)}
          className="nodrag"
        >
          {LAYOUT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </BaseNode>
  );
});
