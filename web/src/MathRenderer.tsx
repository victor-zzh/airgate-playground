import type { CSSProperties } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  displayMode: boolean;
  style: CSSProperties;
  tex: string;
}

export default function MathRenderer({ displayMode, style, tex }: MathRendererProps) {
  const html = katex.renderToString(tex, {
    displayMode,
    throwOnError: false,
    strict: 'ignore',
    trust: false,
  });

  const Tag = displayMode ? 'div' : 'span';
  return <Tag style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
