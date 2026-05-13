import { Handle, Position } from '@xyflow/react';
import { PORT_COLORS } from '../registry';
import type { PortDataType } from '../types';

interface NodePortProps {
  id: string;
  type: 'source' | 'target';
  dataType: PortDataType;
  connected?: boolean;
  position?: Position;
}

export function NodePort({ id, type, dataType, connected, position }: NodePortProps) {
  const color = PORT_COLORS[dataType] || PORT_COLORS.any;
  const pos = position || (type === 'source' ? Position.Right : Position.Left);

  return (
    <Handle
      id={id}
      type={type}
      position={pos}
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        background: connected ? color : 'var(--ag-color-bgDeep, #0a0e17)',
        cursor: 'crosshair',
      }}
    />
  );
}
