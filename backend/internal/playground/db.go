package playground

import (
	"database/sql"
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
	ID              int64     `json:"id"`
	ConversationID  int64     `json:"conversation_id"`
	Role            string    `json:"role"`
	Content         string    `json:"content"`
	Reasoning       string    `json:"reasoning,omitempty"`
	ReasoningEffort string    `json:"reasoning_effort,omitempty"`
	Platform        string    `json:"platform,omitempty"`
	Model           string    `json:"model,omitempty"`
	GroupID         int64     `json:"group_id,omitempty"`
	InputTokens     int       `json:"input_tokens,omitempty"`
	OutputTokens    int       `json:"output_tokens,omitempty"`
	Cost            float64   `json:"cost,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
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
			created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		ALTER TABLE playground_messages ADD COLUMN IF NOT EXISTS reasoning TEXT NOT NULL DEFAULT '';
		ALTER TABLE playground_messages ADD COLUMN IF NOT EXISTS reasoning_effort TEXT NOT NULL DEFAULT '';

		CREATE INDEX IF NOT EXISTS idx_playground_msg_conv ON playground_messages(conversation_id, created_at);

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
