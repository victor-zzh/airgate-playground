// 代码语法高亮：highlight.js 走 KaTeX/xlsx 同款 vendor 懒加载（不打进单文件 bundle），
// 首个带语言标注的代码块出现时才拉取。主题色板注入一次，经 [data-theme] 适配明暗双主题。

const VENDOR_ASSET_BASE = '/plugins/airgate-playground/assets/vendor';

export interface HighlightRuntime {
  highlight: (code: string, options: { language: string; ignoreIllegals?: boolean }) => { value: string };
  getLanguage: (name: string) => unknown;
}

declare global {
  interface Window {
    hljs?: HighlightRuntime;
  }
}

let hljsPromise: Promise<HighlightRuntime> | null = null;

// 常见 fence 语言别名 → hljs 语言名
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  golang: 'go',
  'c++': 'cpp',
  'c#': 'csharp',
  cs: 'csharp',
  docker: 'dockerfile',
  html: 'xml',
  vue: 'xml',
  svelte: 'xml',
};

export function normalizeHighlightLanguage(raw: string): string {
  const lang = raw.trim().toLowerCase();
  return LANGUAGE_ALIASES[lang] || lang;
}

export function loadHighlightRuntime(): Promise<HighlightRuntime> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('highlight.js is only available in the browser'));
  }
  if (window.hljs) return Promise.resolve(window.hljs);
  if (hljsPromise) return hljsPromise;

  hljsPromise = new Promise<HighlightRuntime>((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    // blob 模块内路径型地址无法解析，必须拼完整 URL（同 attachments/vendor.ts）
    script.src = new URL(`${VENDOR_ASSET_BASE}/hljs/highlight.min.js`, window.location.origin).href;
    script.onload = () => {
      if (window.hljs) {
        injectHighlightTheme();
        resolve(window.hljs);
      } else {
        hljsPromise = null;
        reject(new Error('hljs did not initialize'));
      }
    };
    script.onerror = () => {
      hljsPromise = null;
      script.remove();
      reject(new Error('Failed to load highlight.js'));
    };
    document.head.appendChild(script);
  });
  return hljsPromise;
}

const THEME_STYLE_ID = 'pg-hljs-theme';

// One Dark / One Light 双色板，按 core 的 [data-theme] 切换；只作用于聊天代码块。
function injectHighlightTheme() {
  if (document.getElementById(THEME_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = THEME_STYLE_ID;
  style.textContent = `
.pg-md-code .hljs-comment,.pg-md-code .hljs-quote{color:#7f848e;font-style:italic}
.pg-md-code .hljs-keyword,.pg-md-code .hljs-selector-tag,.pg-md-code .hljs-doctag{color:#c678dd}
.pg-md-code .hljs-string,.pg-md-code .hljs-regexp,.pg-md-code .hljs-addition{color:#98c379}
.pg-md-code .hljs-number,.pg-md-code .hljs-literal,.pg-md-code .hljs-params{color:#d19a66}
.pg-md-code .hljs-title,.pg-md-code .hljs-title.function_,.pg-md-code .hljs-section{color:#61afef}
.pg-md-code .hljs-title.class_,.pg-md-code .hljs-type{color:#e5c07b}
.pg-md-code .hljs-attr,.pg-md-code .hljs-attribute,.pg-md-code .hljs-variable,.pg-md-code .hljs-template-variable,.pg-md-code .hljs-name,.pg-md-code .hljs-selector-class,.pg-md-code .hljs-selector-id,.pg-md-code .hljs-deletion{color:#e06c75}
.pg-md-code .hljs-built_in,.pg-md-code .hljs-symbol,.pg-md-code .hljs-meta,.pg-md-code .hljs-link{color:#56b6c2}
[data-theme="light"] .pg-md-code .hljs-comment,[data-theme="light"] .pg-md-code .hljs-quote{color:#a0a1a7}
[data-theme="light"] .pg-md-code .hljs-keyword,[data-theme="light"] .pg-md-code .hljs-selector-tag,[data-theme="light"] .pg-md-code .hljs-doctag{color:#a626a4}
[data-theme="light"] .pg-md-code .hljs-string,[data-theme="light"] .pg-md-code .hljs-regexp,[data-theme="light"] .pg-md-code .hljs-addition{color:#50a14f}
[data-theme="light"] .pg-md-code .hljs-number,[data-theme="light"] .pg-md-code .hljs-literal,[data-theme="light"] .pg-md-code .hljs-params{color:#986801}
[data-theme="light"] .pg-md-code .hljs-title,[data-theme="light"] .pg-md-code .hljs-title.function_,[data-theme="light"] .pg-md-code .hljs-section{color:#4078f2}
[data-theme="light"] .pg-md-code .hljs-title.class_,[data-theme="light"] .pg-md-code .hljs-type{color:#c18401}
[data-theme="light"] .pg-md-code .hljs-attr,[data-theme="light"] .pg-md-code .hljs-attribute,[data-theme="light"] .pg-md-code .hljs-variable,[data-theme="light"] .pg-md-code .hljs-template-variable,[data-theme="light"] .pg-md-code .hljs-name,[data-theme="light"] .pg-md-code .hljs-selector-class,[data-theme="light"] .pg-md-code .hljs-selector-id,[data-theme="light"] .pg-md-code .hljs-deletion{color:#e45649}
[data-theme="light"] .pg-md-code .hljs-built_in,[data-theme="light"] .pg-md-code .hljs-symbol,[data-theme="light"] .pg-md-code .hljs-meta,[data-theme="light"] .pg-md-code .hljs-link{color:#0184bc}
`;
  document.head.appendChild(style);
}
