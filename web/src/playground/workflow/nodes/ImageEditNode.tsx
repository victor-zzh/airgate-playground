import { memo, useRef } from 'react';
import { useReactFlow, useEdges } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { BaseNode } from './BaseNode';
import { workflowStyles as ws } from '../styles';
import type { WorkflowNodeData } from '../types';

type Props = { id: string; data: WorkflowNodeData & Record<string, unknown>; selected?: boolean };

export const ImageEditNode = memo(function ImageEditNode({ id, data, selected }: Props) {
  const { t } = useTranslation();
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageConnected = edges.some(e => e.target === id && e.targetHandle === 'image');

  const updateValue = (key: string, value: unknown) => {
    setNodes(nds =>
      nds.map(n =>
        n.id === id ? { ...n, data: { ...n.data, values: { ...(n.data as WorkflowNodeData).values, [key]: value } } } : n,
      ),
    );
  };

  const prompt = (data.values?.prompt as string) ?? '';
  const sourceUrl = (data.values?.sourceUrl as string) ?? '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      updateValue('sourceUrl', ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <BaseNode id={id} data={data} selected={selected}>
      <div style={{ padding: '4px 12px 8px' }}>
        {!isImageConnected && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              className="nodrag"
            />
            <button
              type="button"
              style={{
                ...ws.nodeInput,
                cursor: 'pointer',
                textAlign: 'center',
                color: sourceUrl ? 'inherit' : 'var(--ag-color-textTertiary, #6b7280)',
                marginBottom: 6,
              }}
              onClick={() => fileInputRef.current?.click()}
              className="nodrag"
            >
              {sourceUrl ? t('playground.wf_change_image') : t('playground.wf_select_image')}
            </button>
            {sourceUrl && (
              <div style={{ marginBottom: 6 }}>
                <img src={sourceUrl} alt="Source" style={ws.nodePreviewImage} />
              </div>
            )}
          </>
        )}
        <textarea
          style={ws.nodeTextarea}
          value={prompt}
          placeholder="Describe the edit..."
          onChange={e => updateValue('prompt', e.target.value)}
          className="nodrag"
        />
      </div>
    </BaseNode>
  );
});
