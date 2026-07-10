package playground

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"strings"
	"testing"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

func TestCompileChatForwardPlanOpenAIKeepsChatCompletionsBody(t *testing.T) {
	body := []byte(`{"model":"gpt-5.5","messages":[{"role":"user","content":"hi"}],"stream":true}`)

	plan, err := compileChatForwardPlan("openai", body)
	if err != nil {
		t.Fatalf("compileChatForwardPlan() error = %v", err)
	}
	if plan.Platform != "openai" {
		t.Fatalf("platform = %q, want openai", plan.Platform)
	}
	if plan.Path != "/v1/chat/completions" {
		t.Fatalf("path = %q, want /v1/chat/completions", plan.Path)
	}
	if plan.NormalizeSSE {
		t.Fatalf("NormalizeSSE = true, want false")
	}
	if !bytes.Equal(plan.Body, body) {
		t.Fatalf("body changed: %s", plan.Body)
	}
}

func TestCompileChatForwardPlanClaudeCompilesMessagesRequest(t *testing.T) {
	body := []byte(`{
		"model":"claude-sonnet-4-5-20250929",
		"messages":[
			{"role":"system","content":"You are concise."},
			{"role":"user","content":[
				{"type":"text","text":"Analyze this file."},
				{"type":"image_url","image_url":{"url":"data:image/png;base64,aGVsbG8="}}
			]},
			{"role":"assistant","content":"Ready."},
			{"role":"user","content":"Go"}
		],
		"stream":true,
		"reasoning_effort":"medium"
	}`)

	plan, err := compileChatForwardPlan("claude", body)
	if err != nil {
		t.Fatalf("compileChatForwardPlan() error = %v", err)
	}
	if plan.Platform != "claude" {
		t.Fatalf("platform = %q, want claude", plan.Platform)
	}
	if plan.Path != "/v1/messages" {
		t.Fatalf("path = %q, want /v1/messages", plan.Path)
	}
	if !plan.NormalizeSSE {
		t.Fatalf("NormalizeSSE = false, want true")
	}

	var got map[string]any
	if err := json.Unmarshal(plan.Body, &got); err != nil {
		t.Fatalf("compiled body is invalid JSON: %v\n%s", err, plan.Body)
	}
	if got["model"] != "claude-sonnet-4-5-20250929" {
		t.Fatalf("model = %v", got["model"])
	}
	if got["stream"] != true {
		t.Fatalf("stream = %v, want true", got["stream"])
	}
	// reasoning_effort=medium → thinking budget 8192，max_tokens 同步抬高
	thinking, ok := got["thinking"].(map[string]any)
	if !ok || thinking["type"] != "enabled" || thinking["budget_tokens"] != float64(8192) {
		t.Fatalf("thinking = %v, want enabled/8192", got["thinking"])
	}
	if got["max_tokens"] != float64(8192+defaultClaudeMaxTokens) {
		t.Fatalf("max_tokens = %v, want budget+default", got["max_tokens"])
	}
	system := got["system"].([]any)
	if system[0].(map[string]any)["text"] != "You are concise." {
		t.Fatalf("system = %+v", system)
	}
	messages := got["messages"].([]any)
	if len(messages) != 3 {
		t.Fatalf("messages len = %d, want 3", len(messages))
	}
	firstContent := messages[0].(map[string]any)["content"].([]any)
	if firstContent[0].(map[string]any)["text"] != "Analyze this file." {
		t.Fatalf("first text block = %+v", firstContent[0])
	}
	image := firstContent[1].(map[string]any)
	if image["type"] != "image" {
		t.Fatalf("image type = %v", image["type"])
	}
	source := image["source"].(map[string]any)
	if source["media_type"] != "image/png" || source["data"] != "aGVsbG8=" {
		t.Fatalf("image source = %+v", source)
	}
}

func TestCompileChatForwardPlanClaudeKeepsConversationTurnsAndFileText(t *testing.T) {
	body := []byte(`{
		"model":"claude-haiku-4-5-20251001",
		"messages":[
			{"role":"user","content":"OpenAI turn"},
			{"role":"assistant","content":"OpenAI answer"},
			{"role":"user","content":[
				{"type":"text","text":"Analyze attached content.\n\n<file name=\"report.md\" type=\"text/markdown\" size=\"18\">\n# Revenue\n42\n</file>"}
			]}
		],
		"stream":false,
		"stream_options":{"include_usage":true},
		"reasoning_effort":"high"
	}`)

	plan, err := compileChatForwardPlan("anthropic", body)
	if err != nil {
		t.Fatalf("compileChatForwardPlan() error = %v", err)
	}
	if plan.Platform != "claude" || plan.Path != "/v1/messages" {
		t.Fatalf("platform/path = %s %s, want claude /v1/messages", plan.Platform, plan.Path)
	}

	var got map[string]any
	if err := json.Unmarshal(plan.Body, &got); err != nil {
		t.Fatalf("compiled body is invalid JSON: %v\n%s", err, plan.Body)
	}
	if got["stream"] != false {
		t.Fatalf("stream = %v, want false", got["stream"])
	}
	if _, ok := got["stream_options"]; ok {
		t.Fatalf("stream_options should not be forwarded to Claude body: %s", plan.Body)
	}
	if _, ok := got["reasoning_effort"]; ok {
		t.Fatalf("reasoning_effort should not be forwarded to Claude body: %s", plan.Body)
	}
	messages := got["messages"].([]any)
	if len(messages) != 3 {
		t.Fatalf("messages len = %d, want 3", len(messages))
	}
	if role := messages[1].(map[string]any)["role"]; role != "assistant" {
		t.Fatalf("second role = %v, want assistant", role)
	}
	lastContent := messages[2].(map[string]any)["content"].([]any)
	text := lastContent[0].(map[string]any)["text"].(string)
	if !strings.Contains(text, `<file name="report.md"`) || !strings.Contains(text, "# Revenue") {
		t.Fatalf("last text block = %q, want file content", text)
	}
}

func TestCompileChatForwardPlanClaudeRejectsEmptyMessages(t *testing.T) {
	_, err := compileChatForwardPlan("claude", []byte(`{"model":"claude-sonnet-4-5-20250929","messages":[]}`))
	if err == nil || !strings.Contains(err.Error(), "messages required") {
		t.Fatalf("err = %v, want messages required", err)
	}
}

func TestClaudeSSEBridgeConvertsTextDeltasAndUsage(t *testing.T) {
	var out bytes.Buffer
	bridge := &claudeSSEBridge{w: &out, model: "claude-sonnet-4-5-20250929"}

	chunks := []string{
		"event: content_block_delta\n",
		"data: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"hel\"}}\n\n",
		"data: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"lo\"}}\r\n\r\n",
		"data: {\"type\":\"message_delta\",\"usage\":{\"input_tokens\":3,\"output_tokens\":2}}\n\n",
	}
	for _, chunk := range chunks {
		if _, err := bridge.Write([]byte(chunk)); err != nil {
			t.Fatalf("bridge.Write() error = %v", err)
		}
	}
	if err := bridge.Flush(); err != nil {
		t.Fatalf("bridge.Flush() error = %v", err)
	}

	got := out.String()
	if !strings.Contains(got, `"content":"hel"`) || !strings.Contains(got, `"content":"lo"`) {
		t.Fatalf("output = %s, want OpenAI content deltas", got)
	}
	if !strings.Contains(got, `"usage":{"input_tokens":3,"output_tokens":2}`) {
		t.Fatalf("output = %s, want usage frame", got)
	}
}

func TestNormalizeClaudeMessageResponse(t *testing.T) {
	body := []byte(`{
		"id":"msg_123",
		"model":"claude-sonnet-4-5-20250929",
		"content":[{"type":"text","text":"hello"},{"type":"text","text":" world"}],
		"stop_reason":"end_turn",
		"usage":{"input_tokens":9,"output_tokens":2}
	}`)

	normalized, err := normalizeClaudeMessageResponse(body)
	if err != nil {
		t.Fatalf("normalizeClaudeMessageResponse() error = %v", err)
	}
	got := string(normalized)
	if !strings.Contains(got, `"object":"chat.completion"`) {
		t.Fatalf("normalized = %s, want chat.completion", got)
	}
	if !strings.Contains(got, `"content":"hello world"`) {
		t.Fatalf("normalized = %s, want merged content", got)
	}
	if !strings.Contains(got, `"prompt_tokens":9`) || !strings.Contains(got, `"completion_tokens":2`) {
		t.Fatalf("normalized = %s, want token usage", got)
	}
}

func TestWriteOpenAIUsageAcceptsSDKUsage(t *testing.T) {
	var out bytes.Buffer
	usage := &sdk.Usage{Model: "claude-opus-4-8"}
	if err := writeOpenAIUsage(&out, usage, usage.Model); err != nil {
		t.Fatalf("writeOpenAIUsage() error = %v", err)
	}
	if got := out.String(); !strings.Contains(got, `"model":"claude-opus-4-8"`) || !strings.Contains(got, `"usage"`) {
		t.Fatalf("output = %s", got)
	}
}

func TestSniffImageMediaTypeCorrectsMislabeledImages(t *testing.T) {
	t.Parallel()

	pngHead := append([]byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'}, make([]byte, 8)...)
	jpegHead := append([]byte{0xFF, 0xD8, 0xFF, 0xE0}, make([]byte, 8)...)
	webpHead := append([]byte("RIFF\x00\x00\x00\x00WEBP"), make([]byte, 4)...)

	cases := []struct {
		name string
		data []byte
		want string
	}{
		{"png", pngHead, "image/png"},
		{"jpeg", jpegHead, "image/jpeg"},
		{"webp", webpHead, "image/webp"},
		{"unknown", []byte("not an image, just text data"), ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := sniffImageMediaType(base64.StdEncoding.EncodeToString(tc.data))
			if got != tc.want {
				t.Fatalf("sniffImageMediaType(%s) = %q, want %q", tc.name, got, tc.want)
			}
		})
	}
}

func TestOpenAIImagePartCorrectsMediaTypeFromBytes(t *testing.T) {
	t.Parallel()

	// 微信导出场景：.jpg 扩展名声明 image/jpeg，实际字节是 PNG
	pngBytes := append([]byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'}, make([]byte, 16)...)
	dataURL := "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(pngBytes)
	raw, _ := json.Marshal(map[string]string{"url": dataURL})

	block := openAIImagePartToClaudeBlock(raw)
	if block == nil {
		t.Fatal("expected image block")
	}
	source := block["source"].(map[string]any)
	if source["media_type"] != "image/png" {
		t.Fatalf("media_type = %v, want image/png (sniffed from bytes)", source["media_type"])
	}
}

func TestCompileClaudeThinkingByReasoningEffort(t *testing.T) {
	t.Parallel()

	cases := []struct {
		effort     string
		wantBudget int // 0 表示不带 thinking
	}{
		{"minimal", 0},
		{"", 0},
		{"low", 2048},
		{"medium", 8192},
		{"high", 16384},
		{"xhigh", 32768},
	}
	for _, tc := range cases {
		t.Run("effort_"+tc.effort, func(t *testing.T) {
			body := []byte(`{"model":"claude-opus-4-8","messages":[{"role":"user","content":"hi"}],"stream":true,"reasoning_effort":"` + tc.effort + `"}`)
			plan, err := compileChatForwardPlan("claude", body)
			if err != nil {
				t.Fatalf("compile error: %v", err)
			}
			var got map[string]any
			if err := json.Unmarshal(plan.Body, &got); err != nil {
				t.Fatal(err)
			}
			thinking, hasThinking := got["thinking"].(map[string]any)
			if tc.wantBudget == 0 {
				if hasThinking {
					t.Fatalf("effort %q should not enable thinking, got %v", tc.effort, thinking)
				}
				if got["max_tokens"] != float64(defaultClaudeMaxTokens) {
					t.Fatalf("max_tokens = %v, want default", got["max_tokens"])
				}
				return
			}
			if !hasThinking || thinking["budget_tokens"] != float64(tc.wantBudget) {
				t.Fatalf("effort %q thinking = %v, want budget %d", tc.effort, got["thinking"], tc.wantBudget)
			}
			if got["max_tokens"] != float64(tc.wantBudget+defaultClaudeMaxTokens) {
				t.Fatalf("max_tokens = %v, want budget+default", got["max_tokens"])
			}
		})
	}
}

func TestOpenAIXHighClampedToHigh(t *testing.T) {
	t.Parallel()
	// xhigh 是 Claude-only 档；openai 分支应降级到 high 并保留其他字段
	body := []byte(`{"model":"gpt-5.5","messages":[{"role":"user","content":"hi"}],"stream":true,"reasoning_effort":"xhigh","stream_options":{"include_usage":true}}`)
	plan, err := compileChatForwardPlan("openai", body)
	if err != nil {
		t.Fatalf("compile error: %v", err)
	}
	var got map[string]any
	if err := json.Unmarshal(plan.Body, &got); err != nil {
		t.Fatal(err)
	}
	if got["reasoning_effort"] != "high" {
		t.Fatalf("reasoning_effort = %v, want high (clamped from xhigh)", got["reasoning_effort"])
	}
	// 其他字段保留
	if _, ok := got["stream_options"]; !ok {
		t.Fatalf("stream_options dropped during clamp: %s", plan.Body)
	}
	if got["model"] != "gpt-5.5" {
		t.Fatalf("model = %v", got["model"])
	}
}

func TestOpenAINonXHighReasoningUntouched(t *testing.T) {
	t.Parallel()
	body := []byte(`{"model":"gpt-5.5","messages":[{"role":"user","content":"hi"}],"reasoning_effort":"high"}`)
	plan, err := compileChatForwardPlan("openai", body)
	if err != nil {
		t.Fatalf("compile error: %v", err)
	}
	if !bytes.Equal(plan.Body, body) {
		t.Fatalf("non-xhigh openai body should be untouched, got %s", plan.Body)
	}
}
