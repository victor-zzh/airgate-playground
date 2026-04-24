package playground

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"strings"

	sdk "github.com/DouDOU-start/airgate-sdk"
)

type ServiceOptions struct {
	DefaultGroupID     int
	MaxConversations   int
	MaxContextMessages int
}

type Service struct {
	logger *slog.Logger
	db     *sql.DB
	host   sdk.Host
	opts   ServiceOptions
}

func NewService(logger *slog.Logger, db *sql.DB, host sdk.Host, opts ServiceOptions) *Service {
	if opts.DefaultGroupID <= 0 {
		opts.DefaultGroupID = 1
	}
	if opts.MaxContextMessages <= 0 {
		opts.MaxContextMessages = 50
	}
	return &Service{logger: logger, db: db, host: host, opts: opts}
}

// ── Conversation CRUD ──

func (s *Service) CreateConversation(ctx context.Context, userID int, title string, groupID int64, platform, model string) (*Conversation, error) {
	if s.opts.MaxConversations > 0 {
		var count int
		if err := s.db.QueryRowContext(ctx,
			"SELECT COUNT(*) FROM playground_conversations WHERE user_id = $1", userID,
		).Scan(&count); err != nil {
			return nil, fmt.Errorf("count conversations: %w", err)
		}
		if count >= s.opts.MaxConversations {
			return nil, fmt.Errorf("maximum conversations (%d) reached", s.opts.MaxConversations)
		}
	}

	if groupID <= 0 {
		groupID = int64(s.opts.DefaultGroupID)
	}

	conv := &Conversation{UserID: userID, Title: title, GroupID: groupID, Platform: platform, Model: model}
	err := s.db.QueryRowContext(ctx,
		`INSERT INTO playground_conversations (user_id, title, group_id, platform, model)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, created_at, updated_at`,
		userID, title, groupID, platform, model,
	).Scan(&conv.ID, &conv.CreatedAt, &conv.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("insert conversation: %w", err)
	}
	return conv, nil
}

func (s *Service) ListConversations(ctx context.Context, userID int) ([]Conversation, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, user_id, title, group_id, platform, model, created_at, updated_at
		 FROM playground_conversations
		 WHERE user_id = $1
		 ORDER BY updated_at DESC
		 LIMIT 200`, userID,
	)
	if err != nil {
		return nil, err
	}
	defer func() { _ = rows.Close() }()

	var convs []Conversation
	for rows.Next() {
		var c Conversation
		if err := rows.Scan(&c.ID, &c.UserID, &c.Title, &c.GroupID, &c.Platform, &c.Model, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		convs = append(convs, c)
	}
	return convs, rows.Err()
}

func (s *Service) GetConversation(ctx context.Context, userID int, convID int64) (*Conversation, error) {
	c := &Conversation{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, title, group_id, platform, model, created_at, updated_at
		 FROM playground_conversations
		 WHERE id = $1 AND user_id = $2`, convID, userID,
	).Scan(&c.ID, &c.UserID, &c.Title, &c.GroupID, &c.Platform, &c.Model, &c.CreatedAt, &c.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return c, err
}

func (s *Service) UpdateConversation(ctx context.Context, userID int, convID int64, title string, groupID int64, platform, model string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE playground_conversations
		 SET title = $1, group_id = $2, platform = $3, model = $4, updated_at = NOW()
		 WHERE id = $5 AND user_id = $6`,
		title, groupID, platform, model, convID, userID,
	)
	return err
}

func (s *Service) DeleteConversation(ctx context.Context, userID int, convID int64) error {
	_, err := s.db.ExecContext(ctx,
		"DELETE FROM playground_conversations WHERE id = $1 AND user_id = $2",
		convID, userID,
	)
	return err
}

// ── Messages ──

func (s *Service) ListMessages(ctx context.Context, userID int, convID int64) ([]Message, error) {
	var ownerID int
	if err := s.db.QueryRowContext(ctx,
		"SELECT user_id FROM playground_conversations WHERE id = $1", convID,
	).Scan(&ownerID); err != nil {
		return nil, err
	}
	if ownerID != userID {
		return nil, fmt.Errorf("conversation not found")
	}

	rows, err := s.db.QueryContext(ctx,
		`SELECT id, conversation_id, role, content, reasoning, platform, model, group_id, input_tokens, output_tokens, cost, created_at
		 FROM playground_messages
		 WHERE conversation_id = $1
		 ORDER BY created_at`, convID,
	)
	if err != nil {
		return nil, err
	}
	defer func() { _ = rows.Close() }()

	var msgs []Message
	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.ConversationID, &m.Role, &m.Content, &m.Reasoning, &m.Platform, &m.Model, &m.GroupID, &m.InputTokens, &m.OutputTokens, &m.Cost, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	return msgs, rows.Err()
}

func (s *Service) saveMessage(ctx context.Context, convID int64, role, content, reasoning, platform, model string, groupID int64, inputTokens, outputTokens int, cost float64) (*Message, error) {
	m := &Message{
		ConversationID: convID,
		Role:           role,
		Content:        content,
		Reasoning:      reasoning,
		Platform:       platform,
		Model:          model,
		GroupID:        groupID,
		InputTokens:    inputTokens,
		OutputTokens:   outputTokens,
		Cost:           cost,
	}
	err := s.db.QueryRowContext(ctx,
		`INSERT INTO playground_messages (conversation_id, role, content, reasoning, platform, model, group_id, input_tokens, output_tokens, cost)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 RETURNING id, created_at`,
		convID, role, content, reasoning, platform, model, groupID, inputTokens, outputTokens, cost,
	).Scan(&m.ID, &m.CreatedAt)
	if err != nil {
		return nil, err
	}

	if _, err := s.db.ExecContext(ctx, "UPDATE playground_conversations SET updated_at = NOW() WHERE id = $1", convID); err != nil {
		s.logger.Error("failed to refresh conversation timestamp", "error", err, "conv_id", convID)
	}
	return m, nil
}

type PersistMessageRequest struct {
	ConversationID int64   `json:"conversation_id"`
	Role           string  `json:"role"`
	Content        string  `json:"content"`
	Reasoning      string  `json:"reasoning"`
	Platform       string  `json:"platform"`
	Model          string  `json:"model"`
	GroupID        int64   `json:"group_id"`
	InputTokens    int     `json:"input_tokens"`
	OutputTokens   int     `json:"output_tokens"`
	Cost           float64 `json:"cost"`
}

func (s *Service) PersistMessage(ctx context.Context, userID int, req PersistMessageRequest) (*Message, error) {
	if req.ConversationID <= 0 {
		return nil, fmt.Errorf("conversation_id required")
	}
	if req.Role != "user" && req.Role != "assistant" && req.Role != "system" {
		return nil, fmt.Errorf("invalid role")
	}

	conv, err := s.GetConversation(ctx, userID, req.ConversationID)
	if err != nil {
		return nil, fmt.Errorf("get conversation: %w", err)
	}
	if conv == nil {
		return nil, fmt.Errorf("conversation not found")
	}

	groupID := req.GroupID
	if groupID <= 0 {
		groupID = conv.GroupID
	}
	platform := req.Platform
	if platform == "" {
		platform = conv.Platform
	}
	model := req.Model
	if model == "" {
		model = conv.Model
	}

	msg, err := s.saveMessage(ctx, conv.ID, req.Role, req.Content, req.Reasoning, platform, model, groupID, req.InputTokens, req.OutputTokens, req.Cost)
	if err != nil {
		return nil, fmt.Errorf("save message: %w", err)
	}

	if conv.Title == "" && req.Role == "assistant" {
		titleSeed, titleErr := s.latestUserMessageContent(ctx, conv.ID)
		if titleErr != nil {
			s.logger.Error("failed to query title seed", "error", titleErr, "conv_id", conv.ID)
		} else if titleSeed != "" {
			if err := s.UpdateConversation(ctx, userID, conv.ID, generateTitle(titleSeed), conv.GroupID, conv.Platform, conv.Model); err != nil {
				s.logger.Error("failed to update conversation title", "error", err, "conv_id", conv.ID)
			}
		}
	}

	return msg, nil
}

func (s *Service) latestUserMessageContent(ctx context.Context, convID int64) (string, error) {
	var content string
	err := s.db.QueryRowContext(ctx,
		`SELECT content FROM playground_messages
		 WHERE conversation_id = $1 AND role = 'user'
		 ORDER BY created_at DESC
		 LIMIT 1`, convID,
	).Scan(&content)
	if err == sql.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(content), nil
}

func generateTitle(userMessage string) string {
	runes := []rune(userMessage)
	if len(runes) > 30 {
		return string(runes[:30]) + "..."
	}
	return userMessage
}
