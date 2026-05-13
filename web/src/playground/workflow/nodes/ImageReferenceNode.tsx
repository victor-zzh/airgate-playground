import { memo, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { BaseNode } from './BaseNode';
import { workflowStyles as ws } from '../styles';
import type { WorkflowNodeData } from '../types';

type Props = { id: string; data: WorkflowNodeData & Record<string, unknown>; selected?: boolean };

export const ImageReferenceNode = memo(function ImageReferenceNode({ id, data, selected }: Props) {
  const { t } = useTranslation();
  const { setNodes } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateValue = (key: string, value: unknown) => {
    setNodes(nds =>
      nds.map(n =>
        n.id === id ? { ...n, data: { ...n.data, values: { ...(n.data as WorkflowNodeData).values, [key]: value } } } : n,
      ),
    );
  };

  const url = (data.values?.url as string) ?? '';
  const alt = (data.values?.alt as string) ?? '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      updateValue('url', dataUrl);
      if (!alt) updateValue('alt', file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <BaseNode id={id} data={data} selected={selected}>
      <div style={{ padding: '4px 12px 8px' }}>
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
            color: url ? 'inherit' : 'var(--ag-color-textTertiary, #6b7280)',
          }}
          onClick={() => fileInputRef.current?.click()}
          className="nodrag"
        >
          {url ? t('playground.wf_change_image') : t('playground.wf_select_image')}
        </button>
        {url && (
          <div style={{ marginTop: 6 }}>
            <img src={url} alt={alt} style={ws.nodePreviewImage} />
          </div>
        )}
        {url && (
          <input
            style={{ ...ws.nodeInput, marginTop: 4 }}
            type="text"
            value={alt}
            placeholder="Alt text..."
            onChange={e => updateValue('alt', e.target.value)}
            className="nodrag"
          />
        )}
      </div>
    </BaseNode>
  );
});
