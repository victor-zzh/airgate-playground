package playground

import (
	"encoding/json"
	"io"
	"strings"
)

// ── 流式累积器 ────────────────────────────────────────────────────────────────
// 工具循环需要在把文本/思考增量实时转发给前端的同时,在服务端拼装出完整的
// assistant 回合(含 tool_use 输入与 thinking signature),供下一次迭代回放。
// 工具参数增量不下发前端(事件里带完整 arguments)。

// accumToolCall 一次完整的工具调用请求(参数已拼装完成)。
type accumToolCall struct {
	ID   string
	Name string
	Args json.RawMessage
}

// ── Claude(Anthropic SSE)───────────────────────────────────────────────────

type claudeAccumBlock struct {
	blockType string // text | thinking | tool_use
	text      strings.Builder
	thinking  strings.Builder
	signature strings.Builder
	toolID    string
	toolName  string
	inputJSON strings.Builder
}

// claudeStreamAccumulator 挂在 claudeSSEBridge 的事件钩子上,按 index 聚合
// content block,捕获 stop_reason。
type claudeStreamAccumulator struct {
	blocks     map[int]*claudeAccumBlock
	order      []int
	stopReason string
}

func newClaudeStreamAccumulator() *claudeStreamAccumulator {
	return &claudeStreamAccumulator{blocks: map[int]*claudeAccumBlock{}}
}

func (a *claudeStreamAccumulator) handle(data map[string]any) {
	switch data["type"] {
	case "content_block_start":
		idx := intFromAny(data["index"])
		block, _ := data["content_block"].(map[string]any)
		entry := &claudeAccumBlock{}
		entry.blockType, _ = block["type"].(string)
		if entry.blockType == "tool_use" {
			entry.toolID, _ = block["id"].(string)
			entry.toolName, _ = block["name"].(string)
		}
		if _, seen := a.blocks[idx]; !seen {
			a.order = append(a.order, idx)
		}
		a.blocks[idx] = entry
	case "content_block_delta":
		idx := intFromAny(data["index"])
		entry := a.blocks[idx]
		if entry == nil {
			entry = &claudeAccumBlock{}
			a.blocks[idx] = entry
			a.order = append(a.order, idx)
		}
		delta, _ := data["delta"].(map[string]any)
		switch delta["type"] {
		case "text_delta":
			if s, _ := delta["text"].(string); s != "" {
				if entry.blockType == "" {
					entry.blockType = "text"
				}
				entry.text.WriteString(s)
			}
		case "thinking_delta":
			if s, _ := delta["thinking"].(string); s != "" {
				if entry.blockType == "" {
					entry.blockType = "thinking"
				}
				entry.thinking.WriteString(s)
			}
		case "signature_delta":
			if s, _ := delta["signature"].(string); s != "" {
				entry.signature.WriteString(s)
			}
		case "input_json_delta":
			if s, _ := delta["partial_json"].(string); s != "" {
				entry.inputJSON.WriteString(s)
			}
		}
	case "message_delta":
		if delta, ok := data["delta"].(map[string]any); ok {
			if sr, _ := delta["stop_reason"].(string); sr != "" {
				a.stopReason = sr
			}
		}
	}
}

// assistantBlocks 按出现顺序还原 assistant 回合的 content blocks。
// thinking 块带 signature 原样回放(4.6+ 多轮 tool_use 必须回带);
// tool_use 输入拼不出合法 JSON 时回退空对象。
func (a *claudeStreamAccumulator) assistantBlocks() []claudeBlock {
	var out []claudeBlock
	for _, idx := range a.order {
		entry := a.blocks[idx]
		switch entry.blockType {
		case "thinking":
			if entry.thinking.Len() == 0 && entry.signature.Len() == 0 {
				continue
			}
			block := claudeBlock{"type": "thinking", "thinking": entry.thinking.String()}
			if entry.signature.Len() > 0 {
				block["signature"] = entry.signature.String()
			}
			out = append(out, block)
		case "text":
			if entry.text.Len() == 0 {
				continue
			}
			out = append(out, claudeBlock{"type": "text", "text": entry.text.String()})
		case "tool_use":
			out = append(out, claudeBlock{
				"type":  "tool_use",
				"id":    entry.toolID,
				"name":  entry.toolName,
				"input": parseToolInputJSON(entry.inputJSON.String()),
			})
		}
	}
	return out
}

func (a *claudeStreamAccumulator) toolCalls() []accumToolCall {
	var calls []accumToolCall
	for _, idx := range a.order {
		entry := a.blocks[idx]
		if entry.blockType != "tool_use" || entry.toolID == "" {
			continue
		}
		raw, err := json.Marshal(parseToolInputJSON(entry.inputJSON.String()))
		if err != nil {
			raw = []byte("{}")
		}
		calls = append(calls, accumToolCall{ID: entry.toolID, Name: entry.toolName, Args: raw})
	}
	return calls
}

func parseToolInputJSON(raw string) map[string]any {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return map[string]any{}
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
		return map[string]any{}
	}
	return parsed
}

// ── OpenAI(Chat Completions SSE)─────────────────────────────────────────────

// openaiStreamFilter 串在透传 writer 前:content/reasoning 增量原样转发;
// delta.tool_calls 增量服务端吸收(按 index 聚合 id/name/arguments 分片);
// finish_reason / 上游 usage 帧 / [DONE] 一律吸收(循环结束由 loop 统一发)。
type openaiStreamFilter struct {
	next io.Writer
	buf  string

	content      strings.Builder
	finishReason string
	toolCalls    []*openaiAccumToolCall
	byIndex      map[int]*openaiAccumToolCall
}

type openaiAccumToolCall struct {
	id   string
	name string
	args strings.Builder
}

func newOpenAIStreamFilter(next io.Writer) *openaiStreamFilter {
	return &openaiStreamFilter{next: next, byIndex: map[int]*openaiAccumToolCall{}}
}

func (f *openaiStreamFilter) Write(data []byte) (int, error) {
	f.buf += strings.ReplaceAll(string(data), "\r\n", "\n")
	for {
		idx := strings.Index(f.buf, "\n\n")
		if idx < 0 {
			break
		}
		event := f.buf[:idx]
		f.buf = f.buf[idx+2:]
		if err := f.handleEvent(event); err != nil {
			return 0, err
		}
	}
	return len(data), nil
}

func (f *openaiStreamFilter) Flush() error {
	if strings.TrimSpace(f.buf) == "" {
		f.buf = ""
		return nil
	}
	event := f.buf
	f.buf = ""
	return f.handleEvent(event)
}

func (f *openaiStreamFilter) handleEvent(event string) error {
	for _, line := range strings.Split(event, "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		payload := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if payload == "" || payload == "[DONE]" {
			continue // [DONE] 由 loop 统一发
		}
		var data map[string]any
		if err := json.Unmarshal([]byte(payload), &data); err != nil {
			// 无法解析的帧原样透传,不吞
			if err := f.forwardRaw(payload); err != nil {
				return err
			}
			continue
		}
		if data["error"] != nil {
			if err := f.forwardRaw(payload); err != nil {
				return err
			}
			continue
		}
		choices, _ := data["choices"].([]any)
		if len(choices) == 0 {
			// usage-only 帧:吸收,循环末尾发聚合值
			continue
		}
		choice, _ := choices[0].(map[string]any)
		finishReason, _ := choice["finish_reason"].(string)
		if finishReason != "" {
			f.finishReason = finishReason
		}
		delta, _ := choice["delta"].(map[string]any)
		if delta != nil {
			if calls, ok := delta["tool_calls"].([]any); ok {
				f.accumToolCalls(calls)
				continue // 工具参数增量不下发
			}
			if s, _ := delta["content"].(string); s != "" {
				f.content.WriteString(s)
			}
		}
		if finishReason != "" {
			continue // 终止帧吸收,循环结束由 loop 统一发 finish/[DONE]
		}
		// 内容/思考增量原样透传
		if err := f.forwardRaw(payload); err != nil {
			return err
		}
	}
	return nil
}

func (f *openaiStreamFilter) forwardRaw(payload string) error {
	if _, err := f.next.Write([]byte("data: " + payload + "\n\n")); err != nil {
		return err
	}
	flushIfPossible(f.next)
	return nil
}

func (f *openaiStreamFilter) accumToolCalls(calls []any) {
	for _, raw := range calls {
		call, _ := raw.(map[string]any)
		if call == nil {
			continue
		}
		idx := intFromAny(call["index"])
		entry := f.byIndex[idx]
		if entry == nil {
			entry = &openaiAccumToolCall{}
			f.byIndex[idx] = entry
			f.toolCalls = append(f.toolCalls, entry)
		}
		if id, _ := call["id"].(string); id != "" {
			entry.id = id
		}
		if fn, _ := call["function"].(map[string]any); fn != nil {
			if name, _ := fn["name"].(string); name != "" {
				entry.name = name
			}
			if args, _ := fn["arguments"].(string); args != "" {
				entry.args.WriteString(args)
			}
		}
	}
}

func (f *openaiStreamFilter) accumulated() []accumToolCall {
	var out []accumToolCall
	for _, entry := range f.toolCalls {
		if entry.id == "" && entry.name == "" {
			continue
		}
		args := strings.TrimSpace(entry.args.String())
		if args == "" || !json.Valid([]byte(args)) {
			args = "{}"
		}
		out = append(out, accumToolCall{ID: entry.id, Name: entry.name, Args: json.RawMessage(args)})
	}
	return out
}
