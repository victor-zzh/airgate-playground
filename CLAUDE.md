# airgate-playground — Claude 开发指南

> 叠加在 monorepo 根 `../CLAUDE.md` 之上。完整流程见共享 skill **`develop-plugin`**；接口契约见 `../airgate-sdk/CLAUDE.md`。

- **插件身份**：id `airgate-playground`，type `extension`，作用 = Web 聊天 UI（"AI Chat"）。
- 实现 `sdk.ExtensionPlugin`：提供自定义 API / 后台任务，**不做网关转发**；要发起对话经 `Host.Invoke` 调 core/网关能力。
- 元信息在 `backend/internal/playground/metadata.go`。

## 🚫 红线

- 只依赖 `airgate-sdk`，禁止 import core 内部；用 core 能力经 `Host.Invoke`/`InvokeStream`。
- `plugin.yaml` 由 `make manifest` 生成，不可手改。
- 前端单 `index.js` → `web/dist/index.js`，用 `@doudou-start/airgate-theme`。

## 命令

`make dev`（独立调试）· `make manifest` · `make build` · `make ci` · `make release`
