package playground

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

type Plugin struct {
	logger *slog.Logger
	ctx    sdk.PluginContext
	db     *sql.DB
	host   sdk.Host
	svc    *Service
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
	dsn := cfg.GetString("db_dsn")
	if dsn == "" {
		p.logger.Warn("db_dsn not configured; playground loading in unconfigured mode")
		return nil
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		p.logger.Warn("failed to open DB; plugin loading in unconfigured mode", "error", err)
		return nil
	}
	if err := db.Ping(); err != nil {
		_ = db.Close()
		p.logger.Warn("failed to ping DB; plugin loading in unconfigured mode", "error", err)
		return nil
	}
	p.db = db

	storage := NewObjectStorage(p.host)

	p.svc = NewService(p.logger, p.db, p.host, ServiceOptions{
		DefaultGroupID:     cfg.GetInt("default_group_id"),
		MaxConversations:   cfg.GetInt("max_conversations"),
		MaxContextMessages: cfg.GetInt("max_context_messages"),
		Storage:            storage,
	})

	return nil
}

func (p *Plugin) Start(ctx context.Context) error {
	p.logger.Info("AI Playground plugin started")
	if p.svc != nil && p.host != nil {
		go p.reconcileCompletedTasks(ctx)
	}
	return nil
}

// reconcileCompletedTasks checks Core for completed generation tasks whose results
// may not have been persisted to conversation messages (e.g. service restarted
// mid-processing). It runs once on startup.
func (p *Plugin) reconcileCompletedTasks(ctx context.Context) {
	result, err := hostListTasks(ctx, p.host, 0, generationTaskType, 100)
	if err != nil {
		p.logger.Warn("reconcile: failed to list completed tasks", "error", err)
		return
	}

	recovered := 0
	for _, task := range result.Tasks {
		if task.Status != sdk.TaskStatusCompleted {
			continue
		}
		content := stringFromMap(task.Output, "content")
		if content == "" {
			continue
		}
		convID := int64FromMap(task.Input, "conversation_id")
		if convID <= 0 {
			continue
		}

		exists, err := p.svc.hasMessageContent(ctx, convID, "assistant", content)
		if err != nil {
			p.logger.Warn("reconcile: check message failed", "task_id", task.ID, "error", err)
			continue
		}
		if exists {
			continue
		}

		platform := stringFromMap(task.Input, "platform")
		model := stringFromMap(task.Output, "model")
		if model == "" {
			model = stringFromMap(task.Input, "model")
		}
		groupID := int64FromMap(task.Input, "group_id")
		inputTokens := intFromMap(task.Output, "input_tokens")
		outputTokens := intFromMap(task.Output, "output_tokens")
		cost := float64FromMap(task.Output, "cost")

		if _, err := p.svc.saveMessage(ctx, convID, "assistant", content, "", "", platform, model, groupID, inputTokens, outputTokens, cost); err != nil {
			p.logger.Warn("reconcile: save message failed", "task_id", task.ID, "error", err)
			continue
		}
		recovered++
		p.logger.Info("reconcile: recovered task result", "task_id", task.ID, "conversation_id", convID)
	}

	if recovered > 0 {
		p.logger.Info("reconcile: completed", "recovered_count", recovered)
	}
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
	return nil
}

// TaskProcessor implementation — Core dispatches tasks here.

func (p *Plugin) TaskTypes() []string {
	return []string{generationTaskType}
}

func (p *Plugin) ProcessTask(ctx context.Context, task sdk.HostTask) error {
	if p.svc == nil || p.host == nil {
		return fmt.Errorf("plugin not configured")
	}
	return p.svc.ProcessCoreTask(ctx, p.host, p.logger, task)
}

func (p *Plugin) Configured() bool {
	return p.svc != nil
}
