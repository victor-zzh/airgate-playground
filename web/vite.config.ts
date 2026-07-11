import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHARED_MODULES = ['react', 'react-dom', 'react/jsx-runtime', 'react-i18next'];
const projectRoot = dirname(fileURLToPath(import.meta.url));
const katexDistDir = join(projectRoot, 'node_modules', 'katex', 'dist');
const katexOutDir = join(projectRoot, 'dist', 'katex');

function sharedModulesPlugin(): Plugin {
  return {
    name: 'airgate-shared-modules',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        let code = chunk.code;
        for (const mod of SHARED_MODULES) {
          const esc = mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // import Default, { named } from "mod"
          code = code.replace(
            new RegExp(`import\\s+([\\w$]+)\\s*,\\s*\\{([^}]+)\\}\\s*from\\s*["']${esc}["'];?`, 'g'),
            (_m, def, named) => {
              const specs = named.split(',').map((s: string) => {
                const parts = s.trim().split(/\s+as\s+/);
                return parts.length === 2 ? `${parts[0].trim()}: ${parts[1].trim()}` : s.trim();
              }).join(', ');
              return `const ${def} = window.__airgate_shared["${mod}"]; const { ${specs} } = window.__airgate_shared["${mod}"];`;
            },
          );
          // import { named } from "mod"
          code = code.replace(
            new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*["']${esc}["'];?`, 'g'),
            (_m, named) => {
              const specs = named.split(',').map((s: string) => {
                const parts = s.trim().split(/\s+as\s+/);
                return parts.length === 2 ? `${parts[0].trim()}: ${parts[1].trim()}` : s.trim();
              }).join(', ');
              return `const { ${specs} } = window.__airgate_shared["${mod}"];`;
            },
          );
          // import * as X from "mod"
          code = code.replace(
            new RegExp(`import\\s*\\*\\s*as\\s+(\\w+)\\s+from\\s*["']${esc}["'];?`, 'g'),
            (_m, name) => `const ${name} = window.__airgate_shared["${mod}"];`,
          );
          // import Default from "mod"
          code = code.replace(
            new RegExp(`import\\s+([\\w$]+)\\s+from\\s*["']${esc}["'];?`, 'g'),
            (_m, name) => `const ${name} = window.__airgate_shared["${mod}"];`,
          );
          // import "mod" (side-effect only)
          code = code.replace(
            new RegExp(`import\\s*["']${esc}["'];?`, 'g'),
            '',
          );
        }
        chunk.code = code;
      }
    },
  };
}

function copyKatexAssets() {
  rmSync(katexOutDir, { force: true, recursive: true });
  mkdirSync(katexOutDir, { recursive: true });
  copyFileSync(join(katexDistDir, 'katex.min.css'), join(katexOutDir, 'katex.min.css'));
  copyFileSync(join(katexDistDir, 'katex.min.js'), join(katexOutDir, 'katex.min.js'));
  cpSync(join(katexDistDir, 'fonts'), join(katexOutDir, 'fonts'), { recursive: true });
}

// 重量级解析库不打进单文件 bundle，复制到 dist/vendor 供运行时懒加载
// （加载路径见 src/playground/attachments/vendor.ts）。
const vendorOutDir = join(projectRoot, 'dist', 'vendor');

function copyVendorAssets() {
  rmSync(vendorOutDir, { force: true, recursive: true });
  mkdirSync(join(vendorOutDir, 'pdfjs'), { recursive: true });
  mkdirSync(join(vendorOutDir, 'xlsx'), { recursive: true });
  mkdirSync(join(vendorOutDir, 'hljs'), { recursive: true });
  const pdfjsBuildDir = join(projectRoot, 'node_modules', 'pdfjs-dist', 'build');
  copyFileSync(join(pdfjsBuildDir, 'pdf.min.mjs'), join(vendorOutDir, 'pdfjs', 'pdf.min.mjs'));
  copyFileSync(join(pdfjsBuildDir, 'pdf.worker.min.mjs'), join(vendorOutDir, 'pdfjs', 'pdf.worker.min.mjs'));
  copyFileSync(
    join(projectRoot, 'node_modules', 'xlsx', 'dist', 'xlsx.full.min.js'),
    join(vendorOutDir, 'xlsx', 'xlsx.full.min.js'),
  );
  // 代码高亮（UMD，挂 window.hljs；含常用语言集）
  copyFileSync(
    join(projectRoot, 'node_modules', '@highlightjs', 'cdn-assets', 'highlight.min.js'),
    join(vendorOutDir, 'hljs', 'highlight.min.js'),
  );
}

const watchOptions = process.argv.includes('--watch')
  ? { chokidar: { usePolling: true, interval: 1000 } }
  : undefined;

export default defineConfig({
  plugins: [
    react(),
    sharedModulesPlugin(),
    {
      name: 'copy-katex-assets',
      writeBundle: copyKatexAssets,
    },
    {
      name: 'copy-vendor-assets',
      writeBundle: copyVendorAssets,
    },
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: 'index',
    },
    outDir: 'dist',
    rollupOptions: {
      external: SHARED_MODULES,
      output: {
        inlineDynamicImports: true,
      },
    },
    watch: watchOptions,
  },
});
