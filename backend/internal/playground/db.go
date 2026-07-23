package playground

import (
	"database/sql"
	"encoding/json"
	"time"

	_ "github.com/lib/pq"
)

type Conversation struct {
	ID        int64     `json:"id"`
	UserID    int       `json:"user_id"`
	Title     string    `json:"title"`
	GroupID   int64     `json:"group_id"`
	Platform  string    `json:"platform"`
	Model     string    `json:"model"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Message struct {
	ID              int64   `json:"id"`
	ConversationID  int64   `json:"conversation_id"`
	Role            string  `json:"role"`
	Content         string  `json:"content"`
	Reasoning       string  `json:"reasoning,omitempty"`
	ReasoningEffort string  `json:"reasoning_effort,omitempty"`
	Platform        string  `json:"platform,omitempty"`
	Model           string  `json:"model,omitempty"`
	GroupID         int64   `json:"group_id,omitempty"`
	InputTokens     int     `json:"input_tokens,omitempty"`
	OutputTokens    int     `json:"output_tokens,omitempty"`
	Cost            float64 `json:"cost,omitempty"`
	RenderFee       float64 `json:"render_fee"`
	FinishReason    string  `json:"finish_reason,omitempty"`
	// ToolCalls 工具循环时间线(JSON 数组,历史会话重建工具卡片用)。
	ToolCalls json.RawMessage `json:"tool_calls,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

// toolCallAudit 单次工具执行的审计记录。
type toolCallAudit struct {
	UserID         int64
	ConversationID int64
	RequestID      string
	Iteration      int
	ToolName       string
	Arguments      string
	Status         string // ok | error | cancelled
	Error          string
	DurationMs     int64
	ResultBytes    int
}

type Asset struct {
	ID             string
	UserID         int
	ConversationID int64
	ObjectKey      string
	ContentType    string
	SizeBytes      int64
	CreatedAt      time.Time
}

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS playground_conversations (
			id            BIGSERIAL PRIMARY KEY,
			user_id       INTEGER NOT NULL,
			title         TEXT NOT NULL DEFAULT '',
			group_id      BIGINT NOT NULL DEFAULT 0,
			platform      TEXT NOT NULL DEFAULT '',
			model         TEXT NOT NULL DEFAULT '',
			created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_playground_conv_user ON playground_conversations(user_id, updated_at DESC);

		CREATE TABLE IF NOT EXISTS playground_messages (
			id              BIGSERIAL PRIMARY KEY,
			conversation_id BIGINT NOT NULL REFERENCES playground_conversations(id) ON DELETE CASCADE,
			role            TEXT NOT NULL,
			content         TEXT NOT NULL DEFAULT '',
			reasoning       TEXT NOT NULL DEFAULT '',
			reasoning_effort TEXT NOT NULL DEFAULT '',
			platform        TEXT NOT NULL DEFAULT '',
			model           TEXT NOT NULL DEFAULT '',
			group_id        BIGINT NOT NULL DEFAULT 0,
			input_tokens    INTEGER NOT NULL DEFAULT 0,
			output_tokens   INTEGER NOT NULL DEFAULT 0,
			cost            DOUBLE PRECISION NOT NULL DEFAULT 0,
			render_fee      DOUBLE PRECISION NOT NULL DEFAULT 0,
			created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		ALTER TABLE playground_messages ADD COLUMN IF NOT EXISTS reasoning TEXT NOT NULL DEFAULT '';
		ALTER TABLE playground_messages ADD COLUMN IF NOT EXISTS reasoning_effort TEXT NOT NULL DEFAULT '';
		ALTER TABLE playground_messages ADD COLUMN IF NOT EXISTS tool_calls JSONB NOT NULL DEFAULT '[]';
		ALTER TABLE playground_messages ADD COLUMN IF NOT EXISTS finish_reason TEXT NOT NULL DEFAULT '';
		ALTER TABLE playground_messages ADD COLUMN IF NOT EXISTS render_fee DOUBLE PRECISION NOT NULL DEFAULT 0;

		CREATE INDEX IF NOT EXISTS idx_playground_msg_conv ON playground_messages(conversation_id, created_at);

		CREATE TABLE IF NOT EXISTS playground_tool_calls (
			id              BIGSERIAL PRIMARY KEY,
			user_id         BIGINT NOT NULL,
			conversation_id BIGINT NOT NULL DEFAULT 0,
			request_id      TEXT NOT NULL DEFAULT '',
			iteration       INTEGER NOT NULL DEFAULT 0,
			tool_name       TEXT NOT NULL,
			arguments       TEXT NOT NULL DEFAULT '',
			status          TEXT NOT NULL,
			error           TEXT NOT NULL DEFAULT '',
			duration_ms     BIGINT NOT NULL DEFAULT 0,
			result_bytes    INTEGER NOT NULL DEFAULT 0,
			created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_playground_tool_calls_conv ON playground_tool_calls(conversation_id, created_at);

		CREATE TABLE IF NOT EXISTS playground_assets (
			id              TEXT PRIMARY KEY,
			user_id         INTEGER NOT NULL,
			conversation_id BIGINT NOT NULL DEFAULT 0,
			object_key      TEXT NOT NULL,
			content_type    TEXT NOT NULL,
			size_bytes      BIGINT NOT NULL DEFAULT 0,
			created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

			CREATE INDEX IF NOT EXISTS idx_playground_assets_user ON playground_assets(user_id, created_at DESC);
			CREATE INDEX IF NOT EXISTS idx_playground_assets_conv ON playground_assets(conversation_id, created_at DESC);
		`)
	return err
}
