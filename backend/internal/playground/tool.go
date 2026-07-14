package playground

import (
	"context"
	"encoding/json"
	"log/slog"
	"strconv"
	"strings"
	"unicode/utf8"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

// ── 工具循环:工具接口与注册 ───────────────────────────────────────────────────
// AI Chat 的 web search / 文件生成等能力经服务端 tool-loop 实现:模型请求
// 工具调用 → 插件执行 → 结果喂回 → 继续生成,与上游/协议无关。
// 只允许服务端内置工具,客户端自带 tools 一律剥除(见 chat_adapter 白名单编译)。

// maxToolResultBytes 单个工具结果喂回模型的上限(防结果爆 context)。
const maxToolResultBytes = 32 << 10

type toolContext struct {
	userID         int64
	conversationID int64
	requestID      string
	logger         *slog.Logger
}

// toolOutcome 一次工具执行的双面结果:喂模型的文本 + 给前端事件的载荷。
type toolOutcome struct {
	ForModel string
	IsError  bool
	// ForClient 进 SSE tool_call_finished 的 result 字段
	// (web_search → {sources:[...]};generate_document → {file:{...}})。
	ForClient map[string]any
}

type chatTool interface {
	Name() string
	Description() string
	InputSchema() map[string]any
	Execute(ctx context.Context, tc *toolContext, args json.RawMessage) (*toolOutcome, error)
}

// toolSettings 工具循环的运行时配置(插件设置,进程内静态)。
type toolSettings struct {
	WebSearchEnabled      bool
	TavilyAPIKey          string
	MaxIterations         int
	MaxSearchesPerMessage int
}

func defaultToolSettings() toolSettings {
	return toolSettings{MaxIterations: 5, MaxSearchesPerMessage: 3}
}

func resolveToolSettings(cfg sdk.PluginConfig) toolSettings {
	s := defaultToolSettings()
	if cfg == nil {
		return s
	}
	if raw := strings.TrimSpace(cfg.GetString("web_search_enabled")); raw != "" {
		if v, err := strconv.ParseBool(raw); err == nil {
			s.WebSearchEnabled = v
		}
	}
	s.TavilyAPIKey = strings.TrimSpace(cfg.GetString("tavily_api_key"))
	if raw := strings.TrimSpace(cfg.GetString("tool_loop_max_iterations")); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 && v <= 10 {
			s.MaxIterations = v
		}
	}
	if raw := strings.TrimSpace(cfg.GetString("max_searches_per_message")); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 && v <= 10 {
			s.MaxSearchesPerMessage = v
		}
	}
	return s
}

// enabledChatTools 当前请求可用的服务端工具集(空 = 走单趟老路径)。
func (p *Plugin) enabledChatTools() []chatTool {
	settings := p.toolSettingsValue()
	var tools []chatTool
	if settings.WebSearchEnabled && settings.TavilyAPIKey != "" {
		provider := p.searchProvider
		if provider == nil {
			provider = newTavilyClient(settings.TavilyAPIKey)
		}
		tools = append(tools, &webSearchTool{
			provider:      provider,
			maxPerMessage: settings.MaxSearchesPerMessage,
		})
	}
	return tools
}

func (p *Plugin) toolSettingsValue() toolSettings {
	if p.toolCfg != nil {
		return *p.toolCfg
	}
	return defaultToolSettings()
}

// truncateForModel 按字节上限截断(UTF-8 安全),超出时附截断标记。
func truncateForModel(s string, max int) string {
	if max <= 0 || len(s) <= max {
		return s
	}
	cut := s[:max]
	for len(cut) > 0 && !utf8.ValidString(cut) {
		cut = cut[:len(cut)-1]
	}
	return cut + "\n…[truncated]"
}
