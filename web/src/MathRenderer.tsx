import { useEffect, useState, type CSSProperties } from 'react';

interface MathRendererProps {
  displayMode: boolean;
  style: CSSProperties;
  tex: string;
}

const KATEX_STYLESHEET_ID = 'airgate-playground-katex-css';
const KATEX_SCRIPT_ID = 'airgate-playground-katex-js';
const KATEX_ASSET_BASE = '/plugins/airgate-playground/assets/katex';

type KatexRuntime = {
  renderToString: (tex: string, options: {
    displayMode: boolean;
    strict: 'ignore';
    throwOnError: boolean;
    trust: boolean;
  }) => string;
};

declare global {
  interface Window {
    katex?: KatexRuntime;
  }
}

let katexPromise: Promise<KatexRuntime> | null = null;

function ensureKatexStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KATEX_STYLESHEET_ID)) return;

  const link = document.createElement('link');
  link.id = KATEX_STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = `${KATEX_ASSET_BASE}/katex.min.css`;
  document.head.appendChild(link);
}

function loadKatex() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('KaTeX is only available in the browser'));
  }
  if (window.katex) return Promise.resolve(window.katex);
  if (katexPromise) return katexPromise;

  katexPromise = new Promise<KatexRuntime>((resolve, reject) => {
    const existing = document.getElementById(KATEX_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    script.id = KATEX_SCRIPT_ID;
    script.async = true;
    script.src = `${KATEX_ASSET_BASE}/katex.min.js`;
    script.onload = () => {
      if (window.katex) resolve(window.katex);
      else reject(new Error('KaTeX did not initialize'));
    };
    script.onerror = () => reject(new Error('Failed to load KaTeX'));

    if (!existing) {
      document.head.appendChild(script);
    }
  });

  return katexPromise;
}

export default function MathRenderer({ displayMode, style, tex }: MathRendererProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    ensureKatexStylesheet();
    setHtml(null);

    loadKatex()
      .then((katex) => {
        if (cancelled) return;
        setHtml(katex.renderToString(tex, {
          displayMode,
          throwOnError: false,
          strict: 'ignore',
          trust: false,
        }));
      })
      .catch(() => {
        if (!cancelled) setHtml(null);
      });

    return () => {
      cancelled = true;
    };
  }, [displayMode, tex]);

  const Tag = displayMode ? 'div' : 'span';
  if (html == null) return <Tag style={style}>{tex}</Tag>;
  return <Tag style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
