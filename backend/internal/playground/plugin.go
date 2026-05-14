package playground

import (
	"context"
	"database/sql"
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
	return nil
}

func (p *Plugin) Configured() bool {
	return p.svc != nil
}
