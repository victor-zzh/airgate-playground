import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { BaseNode } from './BaseNode';
import { workflowStyles as ws } from '../styles';
import type { WorkflowNodeData } from '../types';

type Props = { id: string; data: WorkflowNodeData & Record<string, unknown>; selected?: boolean };

export const TextInputNode = memo(function TextInputNode({ id, data, selected }: Props) {
  const { t } = useTranslation();
  const { setNodes } = useReactFlow();

  const updateValue = (key: string, value: unknown) => {
    setNodes(nds =>
      nds.map(n =>
        n.id === id ? { ...n, data: { ...n.data, values: { ...(n.data as WorkflowNodeData).values, [key]: value } } } : n,
      ),
    );
  };

  const text = (data.values?.text as string) ?? '';

  return (
    <BaseNode id={id} data={data} selected={selected}>
      <div style={{ padding: '4px 12px 8px' }}>
        <textarea
          style={ws.nodeTextarea}
          value={text}
          placeholder={t('playground.wf_prompt_placeholder')}
          onChange={e => updateValue('text', e.target.value)}
          className="nodrag"
        />
      </div>
    </BaseNode>
  );
});
