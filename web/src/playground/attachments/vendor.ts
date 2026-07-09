// 重量级解析库不打进 index.js（单文件 bundle），沿用 KaTeX 的模式：
// 构建时复制到 dist/vendor/，运行时从插件资源路径懒加载。

const VENDOR_ASSET_BASE = '/plugins/airgate-playground/assets/vendor';

// 插件 index.js 由 core 经 Blob URL 动态加载（plugin-loader.ts），blob 模块内
// 路径型 import specifier 无法解析（blob: 不是层级 URL），必须拼成带 origin 的完整 URL。
function vendorAssetUrl(path: string): string {
  return new URL(`${VENDOR_ASSET_BASE}/${path}`, window.location.origin).href;
}

// ── SheetJS（UMD，挂 window.XLSX）──

export interface XlsxRuntime {
  read: (data: ArrayBuffer, opts: Record<string, unknown>) => {
    SheetNames: string[];
    Sheets: Record<string, unknown>;
  };
  utils: {
    sheet_to_json: (sheet: unknown, opts: Record<string, unknown>) => unknown[];
  };
}

declare global {
  interface Window {
    XLSX?: XlsxRuntime;
  }
}

let xlsxPromise: Promise<XlsxRuntime> | null = null;

export function loadXlsxRuntime(): Promise<XlsxRuntime> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('XLSX is only available in the browser'));
  }
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxPromise) return xlsxPromise;

  xlsxPromise = new Promise<XlsxRuntime>((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = vendorAssetUrl('xlsx/xlsx.full.min.js');
    script.onload = () => {
      if (window.XLSX) resolve(window.XLSX);
      else {
        xlsxPromise = null;
        reject(new Error('XLSX did not initialize'));
      }
    };
    script.onerror = () => {
      xlsxPromise = null;
      script.remove();
      reject(new Error('Failed to load XLSX'));
    };
    document.head.appendChild(script);
  });
  return xlsxPromise;
}

// ── pdf.js（ESM + module worker）──

export interface PdfTextItem {
  str?: string;
  hasEOL?: boolean;
}

export interface PdfPage {
  getTextContent: () => Promise<{ items: PdfTextItem[] }>;
  cleanup?: () => void;
}

export interface PdfDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
  destroy: () => Promise<void>;
}

export interface PdfJsRuntime {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (opts: Record<string, unknown>) => { promise: Promise<PdfDocument> };
}

let pdfjsPromise: Promise<PdfJsRuntime> | null = null;

export function loadPdfJsRuntime(): Promise<PdfJsRuntime> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('pdf.js is only available in the browser'));
  }
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = import(/* @vite-ignore */ vendorAssetUrl('pdfjs/pdf.min.mjs'))
    .then((mod: PdfJsRuntime) => {
      mod.GlobalWorkerOptions.workerSrc = vendorAssetUrl('pdfjs/pdf.worker.min.mjs');
      return mod;
    })
    .catch((err: unknown) => {
      pdfjsPromise = null;
      throw err instanceof Error ? err : new Error('Failed to load pdf.js');
    });
  return pdfjsPromise;
}
