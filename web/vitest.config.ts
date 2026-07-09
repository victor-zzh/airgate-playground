import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    // 真实浏览器的 DOMParser 不执行脚本；happy-dom 默认会执行，关掉以对齐生产行为。
    environmentOptions: {
      happyDOM: {
        settings: { disableJavaScriptEvaluation: true },
      },
    },
    include: ['src/**/*.test.ts'],
  },
});
