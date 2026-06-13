# AirGate Playground（AI Chat）

AirGate 扩展插件：内置 Web 聊天界面。安装后用户可在 AirGate 平台内直接与已接入的 AI 模型对话，无需第三方客户端。

- 插件 ID：`airgate-playground` · 类型：`extension`
- 依赖：AirGate Core（经 `Host.Invoke` 调用平台能力，转发走 `gateway.forward`，由 Core 统一调度与计费）

## 功能

- **多模型对话**：自由切换平台已接入的任意模型，流式输出
- **会话管理**：多会话、消息持久化、历史回看
- **多模态输入**：图片上传（经 Core 资产服务存储）
- **思维链展示**：支持推理模型的 reasoning 内容渲染
- **富文本渲染**：Markdown、代码高亮、KaTeX 数学公式
- **余额显示**：实时展示当前用户余额
- **多语言**：界面 i18n（中/英）

## 构建

```bash
make install   # 安装前后端依赖
make build     # 前端 bundle → 嵌入 → Go 二进制（bin/airgate-playground）
make ci        # lint + test + vet + build
make release   # 交叉编译 linux-amd64
```

产出的二进制由 AirGate Core 作为 gRPC 子进程加载；前端为单 `index.js` bundle，由 Core 统一提供资产服务。开发期建议经 Core 的 `make dev`（含插件 watch）联调。

## 配置

| 配置项 | 说明 |
|---|---|
| `max_conversations_per_user` | 每用户最大会话数限制 |

## 目录结构

```
backend/   Go 插件实现（internal/playground/：路由、会话/消息存储、Host 调用）
web/       前端（React 19 + Vite），输出 web/dist/index.js
```

## 相关文档

- 开发护栏：[`CLAUDE.md`](CLAUDE.md)
- 插件契约与生态架构：`../airgate-core/docs/architecture/current/`
