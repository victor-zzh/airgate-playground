package playground

import (
	"context"
	"database/sql"
	"log/slog"
	"strconv"
	"strings"
	"sync"
	"time"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

type Plugin struct {
	logger *slog.Logger
	ctx    sdk.PluginContext
	db     *sql.DB
	host   sdk.Host
	svc    *Service

	tuning *chatTuning

	metaMu    sync.Mutex
	metaCache map[string]modelMetaEntry
}

// chatTuningValue 返回生效的对话编译参数(Init 未跑到配置阶段时用默认值)。
func (p *Plugin) chatTuningValue() chatTuning {
	if p.tuning != nil {
		return *p.tuning
	}
	return defaultChatTuning()
}

var _ sdk.ExtensionPlugin = (*Plugin)(nil)

func New() *Plugin {
	return &Plugin{}
}

func (p *Plugin) Info() sdk.PluginInfo {
	return BuildPluginInfo()
}

func (p *Plugin) Init(ctx sdk.PluginContext) error {
	p.ctx = ctx
	p.logger = slog.Default()
	if ctx != nil {
		p.logger = ctx.Logger()
	}

	if hostAware, ok := ctx.(sdk.HostAware); ok {
		p.host = hostAware.Host()
	}
	if p.host == nil {
		p.logger.Warn("HostService unavailable; playground will not function")
		return nil
	}

	cfg := ctx.Config()
	tuning := resolveChatTuning(cfg)
	p.tuning = &tuning

	type dsnCandidate struct {
		name string
		dsn  string
	}
	candidates := []dsnCandidate{
		{name: sdk.PluginDSNConfigKey, dsn: strings.TrimSpace(cfg.GetString(sdk.PluginDSNConfigKey))},
		{name: "db_dsn", dsn: strings.TrimSpace(cfg.GetString("db_dsn"))},
	}
	var lastErr error
	seen := map[string]bool{}
	for _, candidate := range candidates {
		if candidate.dsn == "" || seen[candidate.dsn] {
			continue
		}
		seen[candidate.dsn] = true

		db, err := sql.Open("postgres", candidate.dsn)
		if err != nil {
			lastErr = err
			p.logger.Warn("failed to open DB; trying next DSN if available", "dsn_source", candidate.name, "error", err)
			continue
		}
		if err := db.Ping(); err != nil {
			_ = db.Close()
			lastErr = err
			p.logger.Warn("failed to ping DB; trying next DSN if available", "dsn_source", candidate.name, "error", err)
			continue
		}
		p.db = db
		p.logger.Info("playground DB connected", "dsn_source", candidate.name)
		break
	}
	if len(seen) == 0 {
		p.logger.Warn("plugin_dsn/db_dsn not configured; playground loading in unconfigured mode")
		return nil
	}
	if p.db == nil {
		p.logger.Warn("failed to connect DB; playground loading in unconfigured mode", "error", lastErr)
		return nil
	}

	storage := NewObjectStorage(p.host)

	p.svc = NewService(p.logger, p.db, p.host, storage, resolveMaxConversationsPerUser(cfg))

	return nil
}

func (p *Plugin) Start(_ context.Context) error {
	p.logger.Info("AI Playground plugin started")
	return nil
}

func (p *Plugin) Stop(_ context.Context) error {
	if p.db != nil {
		_ = p.db.Close()
	}
	return nil
}

func (p *Plugin) Migrate() error {
	if p.db == nil {
		return nil
	}
	return migrate(p.db)
}

func (p *Plugin) BackgroundTasks() []sdk.BackgroundTask {
	if p.svc == nil {
		return nil
	}
	return []sdk.BackgroundTask{
		{
			Name:     "cleanup_orphan_assets",
			Interval: time.Hour,
			Handler: func(ctx context.Context) error {
				deleted, err := p.svc.CleanupOrphanAssets(ctx, 200)
				if err != nil {
					p.logger.Warn("孤儿资产清理失败", "deleted", deleted, "error", err)
					return err
				}
				if deleted > 0 {
					p.logger.Info("孤儿资产清理完成", "deleted", deleted)
				}
				return nil
			},
		},
	}
}

func (p *Plugin) Configured() bool {
	return p.svc != nil
}

// resolveChatTuning 从插件配置解析对话编译参数(配置变更由 core 重启插件生效)。
func resolveChatTuning(cfg sdk.PluginConfig) chatTuning {
	tuning := defaultChatTuning()
	if cfg == nil {
		return tuning
	}
	tuning.SystemPrompt = strings.TrimSpace(cfg.GetString("chat_system_prompt"))
	if raw := strings.TrimSpace(cfg.GetString("claude_prompt_cache")); raw != "" {
		if v, err := strconv.ParseBool(raw); err == nil {
			tuning.PromptCache = v
		}
	}
	if raw := strings.TrimSpace(cfg.GetString("chat_default_max_tokens")); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 {
			tuning.DefaultMaxTokens = v
		}
	}
	return tuning
}

func resolveMaxConversationsPerUser(cfg sdk.PluginConfig) int {
	const defaultMaxConversationsPerUser = 10
	if cfg == nil {
		return defaultMaxConversationsPerUser
	}
	raw := strings.TrimSpace(cfg.GetString("max_conversations_per_user"))
	if raw == "" {
		return defaultMaxConversationsPerUser
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value < 0 {
		return defaultMaxConversationsPerUser
	}
	return value
}
