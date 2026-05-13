import { memo, type ReactNode } from 'react';
import { useEdges, useReactFlow } from '@xyflow/react';
import { NODE_TYPES } from '../registry';
import { workflowStyles as ws } from '../styles';
import { NodePort } from './NodePort';
import type { WorkflowNodeData } from '../types';

interface BaseNodeProps {
  id: string;
  data: WorkflowNodeData;
  selected?: boolean;
  children?: ReactNode;
  onExecute?: () => void;
}

export const BaseNode = memo(function BaseNode({ id, data, selected, children, onExecute }: BaseNodeProps) {
  const edges = useEdges();
  const { setNodes, setEdges } = useReactFlow();
  const typeDef = NODE_TYPES[data.nodeType];
  if (!typeDef) return null;

  const connectedInputs = new Set(edges.filter(e => e.target === id).map(e => e.targetHandle));
  const connectedOutputs = new Set(edges.filter(e => e.source === id).map(e => e.sourceHandle));

  const deleteNode = () => {
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
  };

  return (
    <div style={{ ...ws.node, ...(selected ? ws.nodeSelected : null) }}>
      {/* Header with category color */}
      <div style={{ ...ws.nodeHeader, background: typeDef.color }}>
        <div style={ws.nodeHeaderLeft}>
          <span style={ws.nodeHeaderLabel}>{data.label || typeDef.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {onExecute && (
            <button
              type="button"
              style={ws.nodePlayBtn}
              onClick={e => { e.stopPropagation(); onExecute(); }}
              title="Execute node"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
          )}
          <button
            type="button"
            style={ws.nodePlayBtn}
            onClick={e => { e.stopPropagation(); deleteNode(); }}
            title="Delete node"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      {/* Input ports */}
      {typeDef.inputs.length > 0 && (
        <div style={ws.nodeBody}>
          {typeDef.inputs.map(port => (
            <div key={port.id} style={ws.nodePortRow}>
              <NodePort id={port.id} type="target" dataType={port.dataType} connected={connectedInputs.has(port.id)} />
              <span style={ws.nodePortLabel}>{port.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Custom body (node-specific controls) */}
      {children}

      {/* Status */}
      {data.status === 'running' && (
        <div style={{ ...ws.nodeStatus, ...ws.nodeStatusRunning }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'pg-spin 0.8s linear infinite' }} />
          Running...
        </div>
      )}
      {data.status === 'completed' && data.result?.images?.length ? (
        <div style={ws.nodePreview}>
          {data.result.images.length === 1 ? (
            <img src={data.result.images[0].url} alt={data.result.images[0].alt} style={ws.nodePreviewImage} />
          ) : (
            <div style={ws.nodePreviewGrid}>
              {data.result.images.slice(0, 4).map((img, i) => (
                <img key={i} src={img.url} alt={img.alt} style={{ ...ws.nodePreviewImage, maxHeight: 80 }} />
              ))}
            </div>
          )}
        </div>
      ) : data.status === 'completed' && data.result?.text ? (
        <div style={ws.nodePreview}>
          <div style={ws.nodePreviewText}>{data.result.text}</div>
        </div>
      ) : null}
      {data.status === 'error' && (
        <div style={{ ...ws.nodeStatus, ...ws.nodeStatusError }}>{data.error || 'Error'}</div>
      )}

      {/* Output ports */}
      {typeDef.outputs.length > 0 && (
        <>
          <div style={ws.nodeDivider} />
          <div style={ws.nodeFooter}>
            {typeDef.outputs.map(port => (
              <div key={port.id} style={{ ...ws.nodePortRow, ...ws.nodeOutputRow }}>
                <span style={ws.nodePortLabel}>{port.label}</span>
                <NodePort id={port.id} type="source" dataType={port.dataType} connected={connectedOutputs.has(port.id)} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});
