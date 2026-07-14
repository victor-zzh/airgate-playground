package playground

import (
	"fmt"
	"strings"
	"time"
)

// ── 默认 system prompt 与缓存断点布局 ─────────────────────────────────────────
// 布局(Claude system 数组):
//   [0] 内置身份+输出约定(稳定块,打 cache_control 断点——连带缓存 tools 声明)
//   [1..] 用户请求自带的 system 块(不丢弃,追加在内置块之后)
//   [末] 当前日期(放在缓存断点之后,避免跨天打穿缓存)
// OpenAI 侧无缓存断点概念,合并为一条 system 消息前置。

const builtinChatSystemPrompt = `You are the AI assistant of HopBase AI Chat.
- Always respond in the same language the user writes in.
- Format answers in Markdown. Use fenced code blocks with language tags for code, and $...$ / $$...$$ (KaTeX) for math.
- Be direct and accurate. If you are unsure about something, say so instead of guessing.`

// chatSystemPromptText 返回生效的默认 system prompt(配置 chat_system_prompt 可整体覆盖)。
func chatSystemPromptText(custom string) string {
	if s := strings.TrimSpace(custom); s != "" {
		return s
	}
	return builtinChatSystemPrompt
}

// systemDateLine 当前日期块。用固定 UTC+8 而非 LoadLocation,避免运行镜像缺 tzdata。
func systemDateLine(now time.Time) string {
	if now.IsZero() {
		now = time.Now()
	}
	cst := now.In(time.FixedZone("UTC+8", 8*3600))
	return fmt.Sprintf("Current date: %s (UTC+8)", cst.Format("2006-01-02"))
}

// buildClaudeSystemBlocks 组装 Claude system 块数组。userBlocks 只保留 text 块
// (Anthropic system 仅接受 text)。cacheOn 时在稳定块打 ephemeral 断点。
func buildClaudeSystemBlocks(custom string, userBlocks []claudeBlock, now time.Time, cacheOn bool) []claudeBlock {
	stable := claudeBlock{"type": "text", "text": chatSystemPromptText(custom)}
	if cacheOn {
		stable["cache_control"] = map[string]any{"type": "ephemeral"}
	}
	out := make([]claudeBlock, 0, len(userBlocks)+2)
	out = append(out, stable)
	for _, block := range userBlocks {
		if t, _ := block["type"].(string); t == "text" {
			out = append(out, block)
		}
	}
	out = append(out, claudeBlock{"type": "text", "text": systemDateLine(now)})
	return out
}

// buildOpenAISystemText OpenAI 侧的默认 system 消息文本(日期拼在末尾)。
func buildOpenAISystemText(custom string, now time.Time) string {
	return chatSystemPromptText(custom) + "\n\n" + systemDateLine(now)
}
