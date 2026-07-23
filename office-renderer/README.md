# HopBase Office Renderer

Internal-only renderer for the AI Chat plugin. It turns controlled Markdown into DOCX with [`dolanmiu/docx`](https://github.com/dolanmiu/docx), and controlled title/content/table slides into PPTX with [`gitbrent/PptxGenJS`](https://github.com/gitbrent/PptxGenJS).

The service accepts only JSON bodies, has request/output size limits, bounded concurrency, no URL/image loading, and no public port in the production Compose fragment. It must be reachable from the plugin over the internal `airgate-net` network at `http://office-renderer:8787`.

```bash
pnpm install
pnpm test
pnpm start
```
