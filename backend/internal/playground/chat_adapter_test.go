package playground

import (
	"bytes"
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
	if got["max_tokens"] != float64(defaultClaudeMaxTokens) {
		t.Fatalf("max_tokens = %v", got["max_tokens"])
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
