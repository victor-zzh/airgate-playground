package playground

import (
	"io"
	"strings"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

// ── 工具循环的 SSE 扩展事件 ───────────────────────────────────────────────────
// 契约:沿用纯 `data: <json>` 帧;工具事件用 object=airgate.tool_event 区分;
// 工具参数不做流式增量(服务端已吸收),started 事件直接带完整 arguments;
// 循环结束发真实 finish_reason 帧 + 聚合 usage + [DONE]。老前端(工具开关
// 未开时不会走到本路径)天然忽略未知 object。

type toolEventCall struct {
	ID         string         `json:"id"`
	Name       string         `json:"name"`
	Arguments  any            `json:"arguments,omitempty"`
	Status     string         `json:"status,omitempty"` // ok | error(仅 finished)
	DurationMs int64          `json:"duration_ms,omitempty"`
	Result     map[string]any `json:"result,omitempty"`
	Error      string         `json:"error,omitempty"`
}

func writeToolEvent(w io.Writer, event string, iteration int, call toolEventCall) error {
	err := sseWriter{w: w}.writeJSON(map[string]any{
		"object":    "airgate.tool_event",
		"event":     event,
		"iteration": iteration,
		"call":      call,
	})
	if err == nil {
		flushIfPossible(w)
	}
	return err
}

// normalizeFinishReason 把 Claude stop_reason 和 OpenAI finish_reason 统一成
// OpenAI 兼容值。原始原因另放 airgate.stop_reason，排障时不会丢信息。
func normalizeFinishReason(reason string) string {
	switch reason {
	case "max_tokens", "model_context_window_exceeded", "length":
		return "length"
	case "tool_use", "tool_calls":
		return "tool_calls"
	case "refusal", "content_filter":
		return "content_filter"
	case "", "end_turn", "stop_sequence", "pause_turn", "stop":
		return "stop"
	default:
		return reason
	}
}

func writeChatFinishChunk(w io.Writer, model, reason, upstreamStopReason string) error {
	payload := map[string]any{
		"id":     "chatcmpl-playground",
		"object": "chat.completion.chunk",
		"model":  model,
		"choices": []map[string]any{
			{"index": 0, "delta": map[string]any{}, "finish_reason": normalizeFinishReason(reason)},
		},
	}
	if upstreamStopReason != "" {
		payload["airgate"] = map[string]any{"stop_reason": upstreamStopReason}
	}
	return sseWriter{w: w}.writeJSON(payload)
}

// writeChatFinish 终止帧 + [DONE]。
func writeChatFinish(w io.Writer, model, reason, upstreamStopReason string) {
	_ = writeChatFinishChunk(w, model, reason, upstreamStopReason)
	_, _ = w.Write([]byte("data: [DONE]\n\n"))
	flushIfPossible(w)
}

// writeAggregatedUsage 循环末尾的聚合 usage 帧(形状与单趟一致,前端 persist
// 零改动),附加 airgate 扩展字段标注循环规模。
func writeAggregatedUsage(w io.Writer, usage *sdk.Usage, iterations, toolCalls int) {
	if usage == nil {
		return
	}
	_ = sseWriter{w: w}.writeJSON(map[string]any{
		"object": "chat.completion.chunk",
		"model":  usage.Model,
		"usage":  usage,
		"airgate": map[string]any{
			"iterations": iterations,
			"tool_calls": toolCalls,
		},
	})
	flushIfPossible(w)
}

func flushIfPossible(w io.Writer) {
	if flusher, ok := w.(interface{ Flush() }); ok {
		flusher.Flush()
	}
}

func isDocumentRenderUsage(usage *sdk.Usage) bool {
	if usage == nil {
		return false
	}
	if strings.HasPrefix(strings.ToLower(usage.Model), "document-render-") {
		return true
	}
	for _, metric := range usage.Metrics {
		if metric.Key == "document_render" {
			return true
		}
	}
	return false
}

// mergeUsage 聚合多次 forward 的 usage:费用累加、Metrics 按 key 累加、
// Model 取最后一次模型调用、FirstTokenMs 取首个。渲染 usage 只追加费用和
// custom metric，不得覆盖模型身份或模型倍率。真实扣费由 core 逐次入账,
// 这里只是给前端展示与 persist 的口径。
func mergeUsage(dst *sdk.Usage, add *sdk.Usage) *sdk.Usage {
	if add == nil {
		return dst
	}
	if dst == nil {
		clone := *add
		clone.Metrics = append([]sdk.UsageMetric(nil), add.Metrics...)
		clone.CostDetails = append([]sdk.UsageCostDetail(nil), add.CostDetails...)
		return &clone
	}
	dst.AccountCost += add.AccountCost
	dst.UserCost += add.UserCost
	renderUsage := isDocumentRenderUsage(add)
	if add.Model != "" && !renderUsage {
		dst.Model = add.Model
	}
	if add.BillingMultiplier != 0 && !renderUsage {
		dst.BillingMultiplier = add.BillingMultiplier
	}
	if dst.Currency == "" {
		dst.Currency = add.Currency
	}
	if dst.FirstTokenMs == 0 {
		dst.FirstTokenMs = add.FirstTokenMs
	}
	for _, m := range add.Metrics {
		key := m.Key
		if key == "" {
			key = m.Label
		}
		merged := false
		for i := range dst.Metrics {
			existing := dst.Metrics[i].Key
			if existing == "" {
				existing = dst.Metrics[i].Label
			}
			if existing == key {
				dst.Metrics[i].Value += m.Value
				dst.Metrics[i].AccountCost += m.AccountCost
				merged = true
				break
			}
		}
		if !merged {
			dst.Metrics = append(dst.Metrics, m)
		}
	}
	dst.CostDetails = append(dst.CostDetails, add.CostDetails...)
	return dst
}
