package playground

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// defaultChatMaxTokens 非思考请求的默认 max_tokens 上限(可经配置
// chat_default_max_tokens 覆盖;计费按实际输出,抬高上限不直接涨成本)。
const defaultChatMaxTokens = 32768

type chatForwardPlan struct {
	Platform      string
	Model         string
	Path          string
	Body          []byte
	NormalizeSSE  bool
	NormalizeJSON bool
	ResponseModel string
}

// chatTuning 对话编译的运行时可配参数(插件设置,进程内静态)。
type chatTuning struct {
	// SystemPrompt 非空时整体覆盖内置默认 system prompt。
	SystemPrompt string
	// PromptCache Claude 多轮 prompt caching 开关(默认开)。
	PromptCache bool
	// DefaultMaxTokens 非思考请求 max_tokens 上限。
	DefaultMaxTokens int
}

func defaultChatTuning() chatTuning {
	return chatTuning{PromptCache: true, DefaultMaxTokens: defaultChatMaxTokens}
}

// compileOpts 一次编译的依赖注入(便于测试)与降级开关。
type compileOpts struct {
	Tuning chatTuning
	// LookupMaxOutput 查询模型 max_output_tokens(nil = 只用静态兜底表)。
	LookupMaxOutput func(model string) (int, bool)
	Now             time.Time
	// DisableThinking / DisableCache:上游 400 降级重试时剥离对应字段。
	DisableThinking bool
	DisableCache    bool
}

func defaultCompileOpts() compileOpts {
	return compileOpts{Tuning: defaultChatTuning(), Now: time.Now()}
}

type openAIChatRequest struct {
	Model           string        `json:"model"`
	Messages        []chatMessage `json:"messages"`
	Stream          *bool         `json:"stream,omitempty"`
	ReasoningEffort string        `json:"reasoning_effort,omitempty"`
}

type chatMessage struct {
	Role    string          `json:"role"`
	Content json.RawMessage `json:"content"`
}

type claudeMessage struct {
	Role    string        `json:"role"`
	Content []claudeBlock `json:"content"`
}

type claudeBlock map[string]any

type claudeMessagesRequest struct {
	Model        string          `json:"model"`
	MaxTokens    int             `json:"max_tokens"`
	System       []claudeBlock   `json:"system,omitempty"`
	Messages     []claudeMessage `json:"messages"`
	Stream       bool            `json:"stream"`
	Thinking     *claudeThinking `json:"thinking,omitempty"`
	OutputConfig map[string]any  `json:"output_config,omitempty"`
}

type claudeThinking struct {
	Type         string `json:"type"`
	BudgetTokens int    `json:"budget_tokens,omitempty"`
}

// reasoning_effort → ≤4.5 族 extended thinking 预算(4.6+ 族改走 adaptive +
// output_config,见 planClaudeGeneration)。minimal 关闭思考。
var claudeThinkingBudgets = map[string]int{
	"low":    4096,
	"medium": 8192,
	"high":   16384,
	"xhigh":  32768,
}

func compileChatForwardPlan(platform string, body []byte) (*chatForwardPlan, error) {
	return compileChatForwardPlanWithOpts(platform, body, defaultCompileOpts())
}

func compileChatForwardPlanWithOpts(platform string, body []byte, opts compileOpts) (*chatForwardPlan, error) {
	platform = strings.ToLower(strings.TrimSpace(platform))
	if platform == "" {
		return nil, fmt.Errorf("platform required")
	}

	var req openAIChatRequest
	if err := json.Unmarshal(body, &req); err != nil {
		return nil, fmt.Errorf("invalid request body")
	}
	req.Model = strings.TrimSpace(req.Model)
	if req.Model == "" {
		return nil, fmt.Errorf("model required")
	}

	switch platform {
	case "openai":
		outBody, err := compileOpenAIChatBody(req, body, opts)
		if err != nil {
			return nil, err
		}
		return &chatForwardPlan{
			Platform:      platform,
			Model:         req.Model,
			Path:          "/v1/chat/completions",
			Body:          outBody,
			ResponseModel: req.Model,
		}, nil
	case "claude", "anthropic":
		compiled, err := compileClaudeMessagesBody(req, opts)
		if err != nil {
			return nil, err
		}
		return &chatForwardPlan{
			Platform:      "claude",
			Model:         req.Model,
			Path:          "/v1/messages",
			Body:          compiled,
			NormalizeSSE:  true,
			NormalizeJSON: true,
			ResponseModel: req.Model,
		}, nil
	default:
		return nil, fmt.Errorf("unsupported platform: %s", platform)
	}
}

// compileOpenAIChatBody 在原 body 上做最小改写:注入默认 system 消息(前置,
// 用户自带 system 保留在后),xhigh 档钳制到 high(OpenAI 枚举只到 high)。
// 其余字段原样保留。
func compileOpenAIChatBody(req openAIChatRequest, body []byte, opts compileOpts) ([]byte, error) {
	var m map[string]json.RawMessage
	if err := json.Unmarshal(body, &m); err != nil {
		return nil, fmt.Errorf("invalid request body")
	}
	if strings.EqualFold(strings.TrimSpace(req.ReasoningEffort), "xhigh") {
		if raw, err := json.Marshal("high"); err == nil {
			m["reasoning_effort"] = raw
		}
	}
	var msgs []json.RawMessage
	if raw, ok := m["messages"]; ok {
		if err := json.Unmarshal(raw, &msgs); err != nil {
			return nil, fmt.Errorf("invalid request body")
		}
	}
	sysMsg, err := json.Marshal(map[string]string{
		"role":    "system",
		"content": buildOpenAISystemText(opts.Tuning.SystemPrompt, opts.Now),
	})
	if err != nil {
		return nil, err
	}
	merged, err := json.Marshal(append([]json.RawMessage{sysMsg}, msgs...))
	if err != nil {
		return nil, err
	}
	m["messages"] = merged
	return json.Marshal(m)
}

func compileClaudeMessagesBody(req openAIChatRequest, opts compileOpts) ([]byte, error) {
	gen := planClaudeGeneration(req.Model, req.ReasoningEffort, opts)
	out := claudeMessagesRequest{
		Model:     req.Model,
		MaxTokens: gen.MaxTokens,
		Stream:    req.Stream == nil || *req.Stream,
		Thinking:  gen.Thinking,
	}
	if gen.Effort != "" {
		out.OutputConfig = map[string]any{"effort": gen.Effort}
	}

	var userSystem []claudeBlock
	for _, msg := range req.Messages {
		role := strings.ToLower(strings.TrimSpace(msg.Role))
		blocks := openAIContentToClaudeBlocks(msg.Content)
		if len(blocks) == 0 {
			continue
		}

		switch role {
		case "system":
			userSystem = append(userSystem, blocks...)
		case "assistant":
			out.Messages = append(out.Messages, claudeMessage{Role: "assistant", Content: blocks})
		case "user", "tool":
			out.Messages = append(out.Messages, claudeMessage{Role: "user", Content: blocks})
		default:
			out.Messages = append(out.Messages, claudeMessage{Role: "user", Content: blocks})
		}
	}

	if len(out.Messages) == 0 {
		return nil, fmt.Errorf("messages required")
	}

	cacheOn := opts.Tuning.PromptCache && !opts.DisableCache
	out.System = buildClaudeSystemBlocks(opts.Tuning.SystemPrompt, userSystem, opts.Now, cacheOn)
	if cacheOn {
		// 增量断点:打在最后一条消息的最后一个块上,多轮会话逐轮命中前缀。
		last := out.Messages[len(out.Messages)-1]
		last.Content[len(last.Content)-1]["cache_control"] = map[string]any{"type": "ephemeral"}
	}

	return json.Marshal(out)
}

func openAIContentToClaudeBlocks(raw json.RawMessage) []claudeBlock {
	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 || bytes.Equal(raw, []byte("null")) {
		return nil
	}

	var text string
	if err := json.Unmarshal(raw, &text); err == nil {
		text = strings.TrimSpace(text)
		if text == "" {
			return nil
		}
		return []claudeBlock{{"type": "text", "text": text}}
	}

	var parts []map[string]json.RawMessage
	if err := json.Unmarshal(raw, &parts); err != nil {
		return nil
	}

	blocks := make([]claudeBlock, 0, len(parts))
	for _, part := range parts {
		var typ string
		_ = json.Unmarshal(part["type"], &typ)
		switch typ {
		case "text":
			var t string
			_ = json.Unmarshal(part["text"], &t)
			t = strings.TrimSpace(t)
			if t != "" {
				blocks = append(blocks, claudeBlock{"type": "text", "text": t})
			}
		case "image_url":
			if block := openAIImagePartToClaudeBlock(part["image_url"]); block != nil {
				blocks = append(blocks, block)
			}
		}
	}
	return blocks
}

func openAIImagePartToClaudeBlock(raw json.RawMessage) claudeBlock {
	var payload struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil
	}
	mediaType, data, ok := parseImageDataURL(payload.URL)
	if !ok {
		return nil
	}
	// 声明类型与字节不符时以字节为准：微信导出的 .jpg 常是 PNG 字节，
	// 浏览器 file.type 只看扩展名，错标的 media_type 会被严格上游拒绝
	// （Could not process image）。嗅探同时治好历史消息里已存的错标图。
	if sniffed := sniffImageMediaType(data); sniffed != "" && sniffed != mediaType {
		mediaType = sniffed
	}
	return claudeBlock{
		"type": "image",
		"source": map[string]any{
			"type":       "base64",
			"media_type": mediaType,
			"data":       data,
		},
	}
}

// sniffImageMediaType 解出 base64 头部字节，按魔数识别真实图片类型；识别不了返回空。
func sniffImageMediaType(b64 string) string {
	if len(b64) < 16 {
		return ""
	}
	head, err := base64.StdEncoding.DecodeString(b64[:16])
	if err != nil || len(head) < 12 {
		return ""
	}
	switch {
	case bytes.HasPrefix(head, []byte{0x89, 'P', 'N', 'G'}):
		return "image/png"
	case bytes.HasPrefix(head, []byte{0xFF, 0xD8, 0xFF}):
		return "image/jpeg"
	case bytes.HasPrefix(head, []byte("GIF8")):
		return "image/gif"
	case bytes.HasPrefix(head, []byte("RIFF")) && bytes.Equal(head[8:12], []byte("WEBP")):
		return "image/webp"
	}
	return ""
}

func parseImageDataURL(value string) (mediaType string, data string, ok bool) {
	const prefix = "data:"
	if !strings.HasPrefix(value, prefix) {
		return "", "", false
	}
	comma := strings.IndexByte(value, ',')
	if comma < 0 {
		return "", "", false
	}
	meta := value[len(prefix):comma]
	if !strings.HasSuffix(strings.ToLower(meta), ";base64") {
		return "", "", false
	}
	mediaType = strings.TrimSuffix(meta, ";base64")
	if !strings.HasPrefix(mediaType, "image/") {
		return "", "", false
	}
	data = value[comma+1:]
	if data == "" {
		return "", "", false
	}
	return mediaType, data, true
}

type sseWriter struct {
	w io.Writer
}

func (s sseWriter) writeJSON(payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	if _, err := s.w.Write([]byte("data: ")); err != nil {
		return err
	}
	if _, err := s.w.Write(body); err != nil {
		return err
	}
	_, err = s.w.Write([]byte("\n\n"))
	return err
}

func writeOpenAIContentDelta(w io.Writer, model, text string) error {
	if text == "" {
		return nil
	}
	return sseWriter{w: w}.writeJSON(map[string]any{
		"id":     "chatcmpl-playground",
		"object": "chat.completion.chunk",
		"model":  model,
		"choices": []map[string]any{
			{
				"index": 0,
				"delta": map[string]any{"content": text},
			},
		},
	})
}

func writeOpenAIReasoningDelta(w io.Writer, model, text string) error {
	if text == "" {
		return nil
	}
	return sseWriter{w: w}.writeJSON(map[string]any{
		"id":     "chatcmpl-playground",
		"object": "chat.completion.chunk",
		"model":  model,
		"choices": []map[string]any{
			{
				"index": 0,
				"delta": map[string]any{"reasoning_content": text},
			},
		},
	})
}

func writeOpenAIUsage(w io.Writer, usage any, model string) error {
	payload := map[string]any{
		"object": "chat.completion.chunk",
		"model":  model,
		"usage":  usage,
	}
	return sseWriter{w: w}.writeJSON(payload)
}

func normalizeClaudeMessageResponse(body []byte) ([]byte, error) {
	var resp struct {
		ID         string `json:"id"`
		Model      string `json:"model"`
		StopReason string `json:"stop_reason"`
		Content    []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
		Usage struct {
			InputTokens  int `json:"input_tokens"`
			OutputTokens int `json:"output_tokens"`
		} `json:"usage"`
		Error any `json:"error,omitempty"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return body, nil
	}
	if resp.Error != nil {
		return body, nil
	}
	var text strings.Builder
	for _, block := range resp.Content {
		if block.Type == "text" && block.Text != "" {
			text.WriteString(block.Text)
		}
	}
	model := resp.Model
	if model == "" {
		model = "claude"
	}
	id := resp.ID
	if id == "" {
		id = "chatcmpl-playground"
	}
	finishReason := resp.StopReason
	if finishReason == "" {
		finishReason = "stop"
	}
	out := map[string]any{
		"id":      id,
		"object":  "chat.completion",
		"model":   model,
		"choices": []map[string]any{{"index": 0, "message": map[string]any{"role": "assistant", "content": text.String()}, "finish_reason": finishReason}},
		"usage": map[string]any{
			"prompt_tokens":     resp.Usage.InputTokens,
			"completion_tokens": resp.Usage.OutputTokens,
			"total_tokens":      resp.Usage.InputTokens + resp.Usage.OutputTokens,
		},
	}
	encoded, err := json.Marshal(out)
	if err != nil {
		return body, nil
	}
	return encoded, nil
}

type claudeSSEBridge struct {
	w     io.Writer
	model string
	buf   string
}

func (b *claudeSSEBridge) Write(data []byte) (int, error) {
	b.buf += strings.ReplaceAll(string(data), "\r\n", "\n")
	for {
		idx := strings.Index(b.buf, "\n\n")
		if idx < 0 {
			break
		}
		event := b.buf[:idx]
		b.buf = b.buf[idx+2:]
		if err := b.handleEvent(event); err != nil {
			return 0, err
		}
	}
	return len(data), nil
}

func (b *claudeSSEBridge) Flush() error {
	if strings.TrimSpace(b.buf) == "" {
		b.buf = ""
		return nil
	}
	event := b.buf
	b.buf = ""
	return b.handleEvent(event)
}

func (b *claudeSSEBridge) handleEvent(event string) error {
	for _, line := range strings.Split(event, "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		payload := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if payload == "" || payload == "[DONE]" {
			continue
		}
		var data map[string]any
		if err := json.Unmarshal([]byte(payload), &data); err != nil {
			continue
		}
		if data["error"] != nil {
			return sseWriter{w: b.w}.writeJSON(data)
		}
		if model, ok := data["model"].(string); ok && model != "" {
			b.model = model
		}
		switch data["type"] {
		case "content_block_delta":
			delta, _ := data["delta"].(map[string]any)
			switch delta["type"] {
			case "text_delta":
				if text, _ := delta["text"].(string); text != "" {
					if err := writeOpenAIContentDelta(b.w, b.model, text); err != nil {
						return err
					}
				}
			case "thinking_delta":
				if text, _ := delta["thinking"].(string); text != "" {
					if err := writeOpenAIReasoningDelta(b.w, b.model, text); err != nil {
						return err
					}
				}
			}
		case "message_delta":
			if usage, ok := data["usage"]; ok {
				if err := writeOpenAIUsage(b.w, usage, b.model); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

func copyStreamingHeaders(dst, src http.Header, normalizeSSE bool) {
	copyHeaders(dst, src)
	if normalizeSSE {
		dst.Set("Content-Type", "text/event-stream")
	}
}

// chatDegradeFlags 检查上游 400 错误体是否指向我们注入的 thinking/output_config/
// cache_control 字段(号池/中转可能不透传新参数),决定降级重试要剥哪些。
func chatDegradeFlags(errBody []byte) (dropThinking, dropCache bool) {
	s := strings.ToLower(string(errBody))
	for _, kw := range []string{"thinking", "output_config", "budget_tokens", "adaptive", "effort"} {
		if strings.Contains(s, kw) {
			dropThinking = true
			break
		}
	}
	dropCache = strings.Contains(s, "cache_control")
	return dropThinking, dropCache
}
