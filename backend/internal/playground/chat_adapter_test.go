package playground

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"strings"
	"testing"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

func TestCompileChatForwardPlanOpenAIInjectsSystemAndKeepsFields(t *testing.T) {
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
	var got map[string]any
	if err := json.Unmarshal(plan.Body, &got); err != nil {
		t.Fatalf("compiled body invalid: %v", err)
	}
	if got["model"] != "gpt-5.5" || got["stream"] != true {
		t.Fatalf("model/stream changed: %s", plan.Body)
	}
	messages := got["messages"].([]any)
	if len(messages) != 2 {
		t.Fatalf("messages len = %d, want 2 (system + user)", len(messages))
	}
	sys := messages[0].(map[string]any)
	if sys["role"] != "system" {
		t.Fatalf("first message role = %v, want system", sys["role"])
	}
	sysText := sys["content"].(string)
	if !strings.Contains(sysText, "HopBase AI Chat") || !strings.Contains(sysText, "Current date:") {
		t.Fatalf("system text = %q, want builtin prompt + date", sysText)
	}
	if user := messages[1].(map[string]any); user["role"] != "user" || user["content"] != "hi" {
		t.Fatalf("user message changed: %+v", user)
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
	// sonnet-4-5 属 budget 族:effort=medium → thinking budget 8192,
	// max_tokens = budget + 正文余量
	thinking, ok := got["thinking"].(map[string]any)
	if !ok || thinking["type"] != "enabled" || thinking["budget_tokens"] != float64(8192) {
		t.Fatalf("thinking = %v, want enabled/8192", got["thinking"])
	}
	if got["max_tokens"] != float64(8192+budgetThinkingHeadroom) {
		t.Fatalf("max_tokens = %v, want budget+headroom", got["max_tokens"])
	}
	// system 布局:[0]=内置稳定块(带缓存断点) [1]=用户自带 [末]=日期块
	system := got["system"].([]any)
	if len(system) != 3 {
		t.Fatalf("system len = %d, want 3: %+v", len(system), system)
	}
	stable := system[0].(map[string]any)
	if !strings.Contains(stable["text"].(string), "HopBase AI Chat") {
		t.Fatalf("system[0] = %+v, want builtin prompt", stable)
	}
	if cc, ok := stable["cache_control"].(map[string]any); !ok || cc["type"] != "ephemeral" {
		t.Fatalf("system[0].cache_control = %v, want ephemeral", stable["cache_control"])
	}
	if system[1].(map[string]any)["text"] != "You are concise." {
		t.Fatalf("system[1] = %+v", system[1])
	}
	if !strings.Contains(system[2].(map[string]any)["text"].(string), "Current date:") {
		t.Fatalf("system[2] = %+v, want date block", system[2])
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

// TestCompileClaudeThinkingMatrix 模型族 × effort 的 thinking 编译矩阵。
// 关键回归:4.6+/5 系不得出现 budget_tokens(上游已移除,发了 400)。
func TestCompileClaudeThinkingMatrix(t *testing.T) {
	t.Parallel()

	type want struct {
		thinkingType string  // "" = 不带 thinking 字段
		budget       float64 // 0 = 不带 budget_tokens
		effort       string  // "" = 不带 output_config
		maxTokens    float64
	}
	cases := []struct {
		name   string
		model  string
		effort string
		want   want
	}{
		// budget 族(≤4.5)
		{"sonnet45_low", "claude-sonnet-4-5-20250929", "low", want{"enabled", 4096, "", 4096 + budgetThinkingHeadroom}},
		{"sonnet45_xhigh", "claude-sonnet-4-5-20250929", "xhigh", want{"enabled", 32768, "", 32768 + budgetThinkingHeadroom}},
		{"sonnet45_minimal", "claude-sonnet-4-5-20250929", "minimal", want{"", 0, "", defaultChatMaxTokens}},
		{"haiku45_none", "claude-haiku-4-5-20251001", "", want{"", 0, "", defaultChatMaxTokens}},
		// adaptive 4.6+ 族
		{"opus48_medium", "claude-opus-4-8", "medium", want{"adaptive", 0, "medium", adaptiveThinkingMaxTokens}},
		{"opus47_xhigh", "claude-opus-4-7", "xhigh", want{"adaptive", 0, "xhigh", adaptiveThinkingMaxTokens}},
		{"sonnet46_high", "claude-sonnet-4-6", "high", want{"adaptive", 0, "high", adaptiveThinkingMaxTokens}},
		{"opus48_minimal", "claude-opus-4-8", "minimal", want{"", 0, "", defaultChatMaxTokens}},
		{"opus48_none", "claude-opus-4-8", "", want{"", 0, "", defaultChatMaxTokens}},
		// 5 系(sonnet-5):minimal 显式 disabled
		{"sonnet5_high", "claude-sonnet-5", "high", want{"adaptive", 0, "high", adaptiveThinkingMaxTokens}},
		{"sonnet5_minimal", "claude-sonnet-5", "minimal", want{"disabled", 0, "", defaultChatMaxTokens}},
		// fable 系:思考常开,不发 thinking 字段;minimal 退化 effort low
		{"fable_medium", "claude-fable-5", "medium", want{"", 0, "medium", adaptiveThinkingMaxTokens}},
		{"fable_minimal", "claude-fable-5", "minimal", want{"", 0, "low", adaptiveThinkingMaxTokens}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			body := []byte(`{"model":"` + tc.model + `","messages":[{"role":"user","content":"hi"}],"stream":true,"reasoning_effort":"` + tc.effort + `"}`)
			plan, err := compileChatForwardPlan("claude", body)
			if err != nil {
				t.Fatalf("compile error: %v", err)
			}
			var got map[string]any
			if err := json.Unmarshal(plan.Body, &got); err != nil {
				t.Fatal(err)
			}
			thinking, hasThinking := got["thinking"].(map[string]any)
			if tc.want.thinkingType == "" {
				if hasThinking {
					t.Fatalf("should not carry thinking, got %v", thinking)
				}
			} else {
				if !hasThinking || thinking["type"] != tc.want.thinkingType {
					t.Fatalf("thinking = %v, want type %q", got["thinking"], tc.want.thinkingType)
				}
				if tc.want.budget == 0 {
					if _, ok := thinking["budget_tokens"]; ok {
						t.Fatalf("budget_tokens must be omitted for %q: %v", tc.model, thinking)
					}
				} else if thinking["budget_tokens"] != tc.want.budget {
					t.Fatalf("budget = %v, want %v", thinking["budget_tokens"], tc.want.budget)
				}
			}
			oc, hasOC := got["output_config"].(map[string]any)
			if tc.want.effort == "" {
				if hasOC {
					t.Fatalf("should not carry output_config, got %v", oc)
				}
			} else if !hasOC || oc["effort"] != tc.want.effort {
				t.Fatalf("output_config = %v, want effort %q", got["output_config"], tc.want.effort)
			}
			if got["max_tokens"] != tc.want.maxTokens {
				t.Fatalf("max_tokens = %v, want %v", got["max_tokens"], tc.want.maxTokens)
			}
		})
	}
}

func TestPlanClaudeGenerationMetaAndDegrade(t *testing.T) {
	t.Parallel()

	// models.list 元数据优先于静态兜底表
	opts := defaultCompileOpts()
	opts.LookupMaxOutput = func(model string) (int, bool) { return 20000, true }
	gen := planClaudeGeneration("claude-opus-4-8", "medium", opts)
	if gen.MaxTokens != 20000 {
		t.Fatalf("MaxTokens = %d, want meta 20000", gen.MaxTokens)
	}

	// DisableThinking 降级:不带 thinking/output_config
	opts = defaultCompileOpts()
	opts.DisableThinking = true
	gen = planClaudeGeneration("claude-sonnet-5", "high", opts)
	if gen.Thinking != nil || gen.Effort != "" {
		t.Fatalf("degraded plan should drop thinking, got %+v", gen)
	}
	if gen.MaxTokens != defaultChatMaxTokens {
		t.Fatalf("degraded MaxTokens = %d, want default", gen.MaxTokens)
	}
}

func TestClaudeModelFamilyClassification(t *testing.T) {
	t.Parallel()
	cases := map[string]claudeFamily{
		"claude-sonnet-4-5-20250929": familyBudget,
		"claude-haiku-4-5-20251001":  familyBudget,
		"claude-sonnet-4-20250514":   familyBudget, // 日期段不作 minor
		"claude-3-7-sonnet":          familyBudget,
		"claude-sonnet-4-6":          familyAdaptive46,
		"claude-opus-4-7":            familyAdaptive46,
		"claude-opus-4-8":            familyAdaptive46,
		"claude-sonnet-5":            familyV5,
		"claude-fable-5":             familyFable,
		"unknown-model":              familyBudget,
	}
	for model, want := range cases {
		if got := claudeModelFamily(model); got != want {
			t.Fatalf("claudeModelFamily(%q) = %v, want %v", model, got, want)
		}
	}
}

func TestChatDegradeFlags(t *testing.T) {
	t.Parallel()
	dropT, dropC := chatDegradeFlags([]byte(`{"error":{"message":"Unexpected value(s) for the thinking parameter"}}`))
	if !dropT || dropC {
		t.Fatalf("thinking error: dropT=%v dropC=%v", dropT, dropC)
	}
	dropT, _ = chatDegradeFlags([]byte(`{"error":{"message":"output_config: Extra inputs are not permitted"}}`))
	if !dropT {
		t.Fatalf("output_config error should drop thinking")
	}
	dropT, dropC = chatDegradeFlags([]byte(`{"error":{"message":"cache_control: Extra inputs are not permitted"}}`))
	if dropT || !dropC {
		t.Fatalf("cache error: dropT=%v dropC=%v", dropT, dropC)
	}
	dropT, dropC = chatDegradeFlags([]byte(`{"error":{"message":"credit balance too low"}}`))
	if dropT || dropC {
		t.Fatalf("unrelated error should not degrade")
	}
}

func TestCompileClaudeCacheBreakpoints(t *testing.T) {
	t.Parallel()
	body := []byte(`{"model":"claude-sonnet-5","messages":[{"role":"user","content":"turn 1"},{"role":"assistant","content":"a1"},{"role":"user","content":"turn 2"}],"stream":true}`)
	plan, err := compileChatForwardPlan("claude", body)
	if err != nil {
		t.Fatal(err)
	}
	var got struct {
		Messages []claudeMessage `json:"messages"`
	}
	if err := json.Unmarshal(plan.Body, &got); err != nil {
		t.Fatal(err)
	}
	last := got.Messages[len(got.Messages)-1]
	if cc, ok := last.Content[len(last.Content)-1]["cache_control"].(map[string]any); !ok || cc["type"] != "ephemeral" {
		t.Fatalf("last block cache_control missing: %+v", last.Content)
	}
	// 前面的消息块不打断点
	if _, ok := got.Messages[0].Content[0]["cache_control"]; ok {
		t.Fatalf("first message should not carry cache_control")
	}

	// 关闭缓存:全程无 cache_control
	opts := defaultCompileOpts()
	opts.Tuning.PromptCache = false
	plan, err = compileChatForwardPlanWithOpts("claude", body, opts)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(plan.Body), "cache_control") {
		t.Fatalf("PromptCache=false must not emit cache_control: %s", plan.Body)
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

func TestOpenAINonXHighReasoningPreserved(t *testing.T) {
	t.Parallel()
	body := []byte(`{"model":"gpt-5.5","messages":[{"role":"user","content":"hi"}],"reasoning_effort":"high"}`)
	plan, err := compileChatForwardPlan("openai", body)
	if err != nil {
		t.Fatalf("compile error: %v", err)
	}
	var got map[string]any
	if err := json.Unmarshal(plan.Body, &got); err != nil {
		t.Fatal(err)
	}
	if got["reasoning_effort"] != "high" {
		t.Fatalf("reasoning_effort = %v, want high untouched", got["reasoning_effort"])
	}
	messages := got["messages"].([]any)
	if len(messages) != 2 || messages[0].(map[string]any)["role"] != "system" {
		t.Fatalf("want injected system + original user, got %+v", messages)
	}
}

// 用户自带 system 消息不被丢弃:内置块在前,用户块随后
func TestOpenAIUserSystemPreservedAfterBuiltin(t *testing.T) {
	t.Parallel()
	body := []byte(`{"model":"gpt-5.5","messages":[{"role":"system","content":"custom rules"},{"role":"user","content":"hi"}]}`)
	plan, err := compileChatForwardPlan("openai", body)
	if err != nil {
		t.Fatal(err)
	}
	var got map[string]any
	if err := json.Unmarshal(plan.Body, &got); err != nil {
		t.Fatal(err)
	}
	messages := got["messages"].([]any)
	if len(messages) != 3 {
		t.Fatalf("messages len = %d, want 3", len(messages))
	}
	if first := messages[0].(map[string]any); !strings.Contains(first["content"].(string), "HopBase AI Chat") {
		t.Fatalf("first system should be builtin, got %+v", first)
	}
	if second := messages[1].(map[string]any); second["content"] != "custom rules" || second["role"] != "system" {
		t.Fatalf("user system should follow builtin, got %+v", second)
	}
}
