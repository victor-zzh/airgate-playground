import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { BaseNode } from './BaseNode';
import { workflowStyles as ws } from '../styles';
import type { WorkflowNodeData } from '../types';

type Props = { id: string; data: WorkflowNodeData & Record<string, unknown>; selected?: boolean };

export const ResizeNode = memo(function ResizeNode({ id, data, selected }: Props) {
  const { t } = useTranslation();
  const { setNodes } = useReactFlow();

  const updateValue = (key: string, value: unknown) => {
    setNodes(nds =>
      nds.map(n =>
        n.id === id ? { ...n, data: { ...n.data, values: { ...(n.data as WorkflowNodeData).values, [key]: value } } } : n,
      ),
    );
  };

  const width = (data.values?.width as number) ?? 1024;
  const height = (data.values?.height as number) ?? 1024;
  const lockAspect = (data.values?.lockAspect as boolean) ?? true;

  const handleWidthChange = (newWidth: number) => {
    if (lockAspect && width > 0) {
      const ratio = height / width;
      updateValue('width', newWidth);
      updateValue('height', Math.round(newWidth * ratio));
    } else {
      updateValue('width', newWidth);
    }
  };

  const handleHeightChange = (newHeight: number) => {
    if (lockAspect && height > 0) {
      const ratio = width / height;
      updateValue('height', newHeight);
      updateValue('width', Math.round(newHeight * ratio));
    } else {
      updateValue('height', newHeight);
    }
  };

  return (
    <BaseNode id={id} data={data} selected={selected}>
      <div style={{ padding: '4px 12px 8px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--ag-color-textTertiary, #6b7280)', marginBottom: 2 }}>{t('playground.wf_width')}</div>
            <input
              style={ws.nodeInput}
              type="number"
              min={1}
              max={8192}
              value={width}
              onChange={e => handleWidthChange(Number(e.target.value))}
              className="nodrag"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--ag-color-textTertiary, #6b7280)', marginBottom: 2 }}>{t('playground.wf_height')}</div>
            <input
              style={ws.nodeInput}
              type="number"
              min={1}
              max={8192}
              value={height}
              onChange={e => handleHeightChange(Number(e.target.value))}
              className="nodrag"
            />
          </div>
        </div>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'var(--ag-color-textSecondary, #9ca3af)' }}
          className="nodrag"
        >
          <input
            type="checkbox"
            checked={lockAspect}
            onChange={e => updateValue('lockAspect', e.target.checked)}
            style={{ cursor: 'pointer' }}
            className="nodrag"
          />
          {t('playground.wf_lock_aspect')}
        </label>
      </div>
    </BaseNode>
  );
});
