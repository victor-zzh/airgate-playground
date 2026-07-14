package playground

import (
	"context"
	"strconv"
	"strings"
	"time"
)

// ── Claude 模型族识别与生成计划 ────────────────────────────────────────────────
// thinking 参数按模型族分叉:≤4.5 用 budget_tokens;4.6+/5 系已移除 budget_tokens
// (发了直接 400),改用 thinking:{type:"adaptive"} + output_config:{effort};
// fable 系思考不可关闭、不发 thinking 字段。max_tokens 以 models.list 的
// max_output_tokens 为准(带 60s 缓存),缺失时按族静态兜底。

type claudeFamily int

const (
	// familyBudget ≤4.5 族(含 3.x/日期版 4.0):thinking 用 budget_tokens。
	familyBudget claudeFamily = iota
	// familyAdaptive46 4.6/4.7/4.8 族:adaptive + output_config;minimal=不发 thinking。
	familyAdaptive46
	// familyV5 5 系(sonnet-5 等,不含 fable):adaptive + output_config;
	// minimal=thinking:{type:"disabled"}。
	familyV5
	// familyFable fable 系:思考常开,不发 thinking 字段,effort 经 output_config;
	// minimal 退化为 effort low。
	familyFable
)

// claudeModelVersion 从模型 ID 提取 (major, minor) 版本段。数字段 ≥100 视为
// 日期(如 20250929)不计入版本。解析不出返回 (0,0)。
func claudeModelVersion(model string) (int, int) {
	parts := strings.Split(strings.ToLower(model), "-")
	for i, part := range parts {
		n, err := strconv.Atoi(part)
		if err != nil || n <= 0 || n >= 100 {
			continue
		}
		major, minor := n, 0
		if i+1 < len(parts) {
			if m, err := strconv.Atoi(parts[i+1]); err == nil && m > 0 && m < 100 {
				minor = m
			}
		}
		return major, minor
	}
	return 0, 0
}

func claudeModelFamily(model string) claudeFamily {
	m := strings.ToLower(model)
	if strings.Contains(m, "fable") {
		return familyFable
	}
	major, minor := claudeModelVersion(m)
	switch {
	case major >= 5:
		return familyV5
	case major == 4 && minor >= 6:
		return familyAdaptive46
	default:
		// 4.5 及更老、无版本段的未知模型:走 budget 老路径,
		// 若上游已移除该参数由 routes 的 400 降级重试兜底。
		return familyBudget
	}
}

// staticClaudeMaxOutput models.list 元数据缺失时的按族兜底(对齐 claude 网关注册表)。
func staticClaudeMaxOutput(model string) int {
	m := strings.ToLower(model)
	if strings.Contains(m, "fable") {
		return 128000
	}
	major, minor := claudeModelVersion(m)
	switch {
	case major >= 5, major == 4 && minor >= 7:
		return 128000
	case major == 4 && (minor == 5 || minor == 6):
		return 64000
	default:
		return 32000
	}
}

// claudeGenPlan 一次 Claude 请求的生成参数决策结果。
type claudeGenPlan struct {
	MaxTokens int
	Thinking  *claudeThinking
	// Effort 非空时编译为 output_config:{effort}。
	Effort string
}

// adaptiveThinkingMaxTokens adaptive 族思考+正文共享 max_tokens 的默认上限。
const adaptiveThinkingMaxTokens = 64000

// budgetThinkingHeadroom budget 族思考外的正文余量(原 4096 常把长答案腰斩)。
const budgetThinkingHeadroom = 16384

func planClaudeGeneration(model, effort string, opts compileOpts) claudeGenPlan {
	effort = strings.ToLower(strings.TrimSpace(effort))
	maxOut := staticClaudeMaxOutput(model)
	if opts.LookupMaxOutput != nil {
		if v, ok := opts.LookupMaxOutput(model); ok && v > 0 {
			maxOut = v
		}
	}
	defaultMax := opts.Tuning.DefaultMaxTokens
	if defaultMax <= 0 {
		defaultMax = defaultChatMaxTokens
	}
	plain := claudeGenPlan{MaxTokens: minInt(defaultMax, maxOut)}
	if opts.DisableThinking {
		return plain
	}

	family := claudeModelFamily(model)
	budget, hasBudgetEffort := claudeThinkingBudgets[effort]
	isMinimal := effort == "minimal"

	switch family {
	case familyBudget:
		if !hasBudgetEffort {
			return plain // minimal / 未选档 → 不发 thinking
		}
		return claudeGenPlan{
			MaxTokens: minInt(budget+budgetThinkingHeadroom, maxOut),
			Thinking:  &claudeThinking{Type: "enabled", BudgetTokens: budget},
		}
	case familyAdaptive46:
		if isMinimal || !hasBudgetEffort {
			return plain
		}
		return claudeGenPlan{
			MaxTokens: minInt(adaptiveThinkingMaxTokens, maxOut),
			Thinking:  &claudeThinking{Type: "adaptive"},
			Effort:    effort,
		}
	case familyV5:
		if isMinimal {
			plain.Thinking = &claudeThinking{Type: "disabled"}
			return plain
		}
		if !hasBudgetEffort {
			return plain
		}
		return claudeGenPlan{
			MaxTokens: minInt(adaptiveThinkingMaxTokens, maxOut),
			Thinking:  &claudeThinking{Type: "adaptive"},
			Effort:    effort,
		}
	case familyFable:
		if isMinimal {
			plain.Effort = "low"
			plain.MaxTokens = minInt(adaptiveThinkingMaxTokens, maxOut)
			return plain
		}
		if !hasBudgetEffort {
			return plain
		}
		return claudeGenPlan{
			MaxTokens: minInt(adaptiveThinkingMaxTokens, maxOut),
			Effort:    effort,
		}
	}
	return plain
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// ── models.list 元数据缓存 ────────────────────────────────────────────────────

const modelMetaTTL = time.Minute

type modelMetaEntry struct {
	fetched time.Time
	maxOut  map[string]int
}

// lookupModelMaxOutput 查询模型 max_output_tokens(带 60s 缓存;拉取失败负缓存,
// 由静态兜底表接管)。
func (p *Plugin) lookupModelMaxOutput(ctx context.Context, platform, model string) (int, bool) {
	if p.host == nil {
		return 0, false
	}
	platform = strings.ToLower(strings.TrimSpace(platform))
	p.metaMu.Lock()
	defer p.metaMu.Unlock()
	entry, ok := p.metaCache[platform]
	if !ok || time.Since(entry.fetched) > modelMetaTTL {
		maxOut := map[string]int{}
		fetchCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		models, err := hostListModels(fetchCtx, p.host, platform)
		cancel()
		if err != nil {
			p.logger.Warn("chat_model_meta_fetch_failed", "platform", platform, "error", err)
		} else {
			for _, m := range models {
				if m.MaxOutputTokens > 0 {
					maxOut[strings.ToLower(m.ID)] = int(m.MaxOutputTokens)
				}
			}
		}
		entry = modelMetaEntry{fetched: time.Now(), maxOut: maxOut}
		if p.metaCache == nil {
			p.metaCache = map[string]modelMetaEntry{}
		}
		p.metaCache[platform] = entry
	}
	v, ok := entry.maxOut[strings.ToLower(strings.TrimSpace(model))]
	return v, ok && v > 0
}
