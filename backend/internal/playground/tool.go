package playground

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
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
	// Terminal 表示工具成功后可直接结束本次回复，无需把结果再次发送给模型。
	Terminal bool
	// TerminalMessage 是由服务端直接流给用户的固定完成提示。
	TerminalMessage string
	// ForClient 进 SSE tool_call_finished 的 result 字段
	// (web_search → {sources:[...]};generate_document → {file:{...}})。
	ForClient map[string]any
	// Usage is a non-model usage record (for example a file render fee) that
	// should be included in the final aggregated SSE usage exactly once.
	Usage *sdk.Usage
}

func terminalToolResult(results []toolExecResult) *toolOutcome {
	for _, result := range results {
		if result.outcome != nil && result.outcome.Terminal && !result.outcome.IsError {
			return result.outcome
		}
	}
	return nil
}

type chatTool interface {
	Name() string
	Description() string
	InputSchema() map[string]any
	Execute(ctx context.Context, tc *toolContext, args json.RawMessage) (*toolOutcome, error)
}

// toolSettings 工具循环的运行时配置(插件设置,进程内静态)。
type toolSettings struct {
	WebSearchEnabled           bool
	TavilyAPIKey               string
	GenerateDocumentEnabled    bool
	GenerateSpreadsheetEnabled bool
	GenerateOfficeEnabled      bool
	ChromiumCDPURL             string
	OfficeRendererURL          string
	PDFRenderFee               float64
	DOCXRenderFee              float64
	PPTXRenderFee              float64
	XLSXRenderFee              float64
	MaxIterations              int
	MaxSearchesPerMessage      int
}

func defaultToolSettings() toolSettings {
	return toolSettings{
		MaxIterations:         5,
		MaxSearchesPerMessage: 3,
		ChromiumCDPURL:        "http://chromium:9222",
		OfficeRendererURL:     "http://office-renderer:8787",
	}
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
	if raw := strings.TrimSpace(cfg.GetString("generate_document_enabled")); raw != "" {
		if v, err := strconv.ParseBool(raw); err == nil {
			s.GenerateDocumentEnabled = v
		}
	}
	if raw := strings.TrimSpace(cfg.GetString("generate_spreadsheet_enabled")); raw != "" {
		if v, err := strconv.ParseBool(raw); err == nil {
			s.GenerateSpreadsheetEnabled = v
		}
	}
	if raw := strings.TrimSpace(cfg.GetString("generate_office_enabled")); raw != "" {
		if v, err := strconv.ParseBool(raw); err == nil {
			s.GenerateOfficeEnabled = v
		}
	}
	if raw := strings.TrimSpace(cfg.GetString("chromium_cdp_url")); raw != "" {
		s.ChromiumCDPURL = raw
	}
	if raw := strings.TrimSpace(cfg.GetString("office_renderer_url")); raw != "" {
		s.OfficeRendererURL = raw
	}
	s.PDFRenderFee = parseNonNegativeFee(cfg.GetString("pdf_render_fee"))
	s.DOCXRenderFee = parseNonNegativeFee(cfg.GetString("docx_render_fee"))
	s.PPTXRenderFee = parseNonNegativeFee(cfg.GetString("pptx_render_fee"))
	s.XLSXRenderFee = parseNonNegativeFee(cfg.GetString("xlsx_render_fee"))
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

func parseNonNegativeFee(raw string) float64 {
	v, err := strconv.ParseFloat(strings.TrimSpace(raw), 64)
	if err != nil || v < 0 || math.IsNaN(v) || math.IsInf(v, 0) {
		return 0
	}
	return v
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
	if (settings.GenerateDocumentEnabled || settings.GenerateOfficeEnabled) && p.svc != nil {
		formats := make([]string, 0, 3)
		if settings.GenerateDocumentEnabled {
			formats = append(formats, "pdf", "markdown")
		}
		if settings.GenerateOfficeEnabled && p.office != nil {
			formats = append(formats, "docx")
		}
		if len(formats) > 0 {
			tools = append(tools, &generateDocumentTool{plugin: p, formats: formats})
		}
	}
	if settings.GenerateSpreadsheetEnabled && p.svc != nil {
		tools = append(tools, &generateSpreadsheetTool{plugin: p})
	}
	if settings.GenerateOfficeEnabled && p.office != nil && p.svc != nil {
		tools = append(tools, &generatePresentationTool{plugin: p})
	}
	return tools
}

func (p *Plugin) toolSettingsValue() toolSettings {
	if p.toolCfg != nil {
		return *p.toolCfg
	}
	return defaultToolSettings()
}

func (p *Plugin) renderFee(format string) float64 {
	s := p.toolSettingsValue()
	switch strings.ToLower(strings.TrimSpace(format)) {
	case "pdf":
		return s.PDFRenderFee
	case "docx":
		return s.DOCXRenderFee
	case "pptx":
		return s.PPTXRenderFee
	case "xlsx":
		return s.XLSXRenderFee
	default:
		return 0
	}
}

// chargeRenderUsage records a successful render after asset registration. The
// asset ID is the idempotency key, so retries or a repeated tool result cannot
// charge twice. A zero fee is still recorded as a zero-cost custom metric for
// observability during the free rollout.
func (p *Plugin) chargeRenderUsage(ctx context.Context, tc *toolContext, format, assetID string, sizeBytes int64, quantity float64) (*sdk.Usage, error) {
	if p.host == nil {
		return nil, fmt.Errorf("Core usage service unavailable")
	}
	if quantity <= 0 {
		quantity = 1
	}
	fee := p.renderFee(format) * quantity
	requestID := "document-render:" + assetID
	return hostRecordUsage(ctx, p.host, map[string]interface{}{
		"user_id":      tc.userID,
		"platform":     "airgate-playground",
		"model":        "document-render-" + strings.ToLower(format),
		"format":       strings.ToLower(format),
		"quantity":     quantity,
		"account_cost": 0,
		"user_cost":    fee,
		"currency":     "",
		"asset_id":     assetID,
		"trace_id":     tc.requestID,
		"metadata": map[string]string{
			"size_bytes":      strconv.FormatInt(sizeBytes, 10),
			"conversation_id": strconv.FormatInt(tc.conversationID, 10),
		},
	}, requestID)
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
