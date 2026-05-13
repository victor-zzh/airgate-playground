import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { cssVar } from '@doudou-start/airgate-theme';

interface Option { value: string; label: string }
interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
}

const triggerStyle: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: `1px solid ${cssVar('borderSubtle')}`,
  borderRadius: 8,
  background: cssVar('bgDeep'),
  color: cssVar('text'),
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  font: 'inherit',
  fontSize: 13,
};

const dropdownStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  zIndex: 50,
  background: cssVar('bgElevated'),
  border: `1px solid ${cssVar('border')}`,
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  maxHeight: 240,
  overflowY: 'auto',
  padding: 4,
};

const optionStyle: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: 'none',
  background: 'transparent',
  color: cssVar('text'),
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: 6,
  fontSize: 13,
  font: 'inherit',
};

const activeOptionStyle: CSSProperties = {
  background: 'rgba(45,212,191,0.12)',
  color: cssVar('primary'),
};

export function CustomSelect({ value, options, onChange, placeholder }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)} style={triggerStyle}>
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.label || placeholder || value}
        </span>
        <span style={{ opacity: 0.5, fontSize: 10 }}>&#9662;</span>
      </button>
      {open && (
        <div style={dropdownStyle}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              style={{ ...optionStyle, ...(opt.value === value ? activeOptionStyle : {}) }}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
