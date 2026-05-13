package playground

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"mime/multipart"
	"net/http"
	"strings"
	"sync"
	"time"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

type CreateImageTaskRequest struct {
	ConversationID int64  `json:"conversation_id"`
	Platform       string `json:"platform"`
	Model          string `json:"model"`
	Prompt         string `json:"prompt"`
	ImageSize      string `json:"image_size,omitempty"`
	GroupID        int64  `json:"group_id,omitempty"`
	Mode           string `json:"mode,omitempty"`
	SourceImage    string `json:"source_image,omitempty"`
	Mask           string `json:"mask,omitempty"`
}

func (s *Service) CreateImageTask(ctx context.Context, userID int, req CreateImageTaskRequest) (*ImageTask, error) {
	if req.Platform == "" {
		return nil, fmt.Errorf("platform required")
	}
	if req.Model == "" {
		return nil, fmt.Errorf("model required")
	}
	if strings.TrimSpace(req.Prompt) == "" {
		return nil, fmt.Errorf("prompt required")
	}

	groupID := req.GroupID
	if req.ConversationID > 0 {
		conv, err := s.GetConversation(ctx, userID, req.ConversationID)
		if err != nil {
			return nil, fmt.Errorf("get conversation: %w", err)
		}
		if conv == nil {
			return nil, fmt.Errorf("conversation not found")
		}
		if groupID <= 0 {
			groupID = conv.GroupID
		}

		userContent := req.Prompt
		storedContent, err := s.storeContentAssets(ctx, userID, conv.ID, userContent)
		if err != nil {
			s.logger.Warn("failed to store user message assets", "error", err)
			storedContent = userContent
		}
		_, err = s.saveMessage(ctx, conv.ID, "user", storedContent, "", "", req.Platform, req.Model, groupID, 0, 0, 0)
		if err != nil {
			return nil, fmt.Errorf("save user message: %w", err)
		}
	}

	task := &ImageTask{}
	err := s.db.QueryRowContext(ctx,
		`INSERT INTO playground_image_tasks (user_id, conversation_id, status, platform, model, prompt, image_size, group_id)
		 VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7)
		 RETURNING id, user_id, conversation_id, status, platform, model, prompt, image_size, group_id,
		           result_content, error_message, input_tokens, output_tokens, cost, created_at, updated_at, completed_at`,
		userID, req.ConversationID, req.Platform, req.Model, req.Prompt, req.ImageSize, groupID,
	).Scan(
		&task.ID, &task.UserID, &task.ConversationID, &task.Status, &task.Platform, &task.Model,
		&task.Prompt, &task.ImageSize, &task.GroupID, &task.ResultContent, &task.ErrorMessage,
		&task.InputTokens, &task.OutputTokens, &task.Cost, &task.CreatedAt, &task.UpdatedAt, &task.CompletedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create image task: %w", err)
	}
	return task, nil
}

func (s *Service) GetImageTask(ctx context.Context, userID int, taskID int64) (*ImageTask, error) {
	s.RecoverStaleTasks(ctx, s.logger)

	task := &ImageTask{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, conversation_id, status, platform, model, prompt, image_size, group_id,
		        result_content, error_message, input_tokens, output_tokens, cost, created_at, updated_at, completed_at
		 FROM playground_image_tasks
		 WHERE id = $1 AND user_id = $2`, taskID, userID,
	).Scan(
		&task.ID, &task.UserID, &task.ConversationID, &task.Status, &task.Platform, &task.Model,
		&task.Prompt, &task.ImageSize, &task.GroupID, &task.ResultContent, &task.ErrorMessage,
		&task.InputTokens, &task.OutputTokens, &task.Cost, &task.CreatedAt, &task.UpdatedAt, &task.CompletedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get image task: %w", err)
	}
	return task, nil
}

func (s *Service) ListImageTasks(ctx context.Context, userID int, conversationID int64) ([]*ImageTask, error) {
	s.RecoverStaleTasks(ctx, s.logger)

	query := `SELECT id, user_id, conversation_id, status, platform, model, prompt, image_size, group_id,
	                 result_content, error_message, input_tokens, output_tokens, cost, created_at, updated_at, completed_at
	          FROM playground_image_tasks WHERE user_id = $1`
	args := []any{userID}
	if conversationID > 0 {
		query += " AND conversation_id = $2"
		args = append(args, conversationID)
	}
	query += " ORDER BY created_at DESC LIMIT 100"

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list image tasks: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var tasks []*ImageTask
	for rows.Next() {
		task := &ImageTask{}
		if err := rows.Scan(
			&task.ID, &task.UserID, &task.ConversationID, &task.Status, &task.Platform, &task.Model,
			&task.Prompt, &task.ImageSize, &task.GroupID, &task.ResultContent, &task.ErrorMessage,
			&task.InputTokens, &task.OutputTokens, &task.Cost, &task.CreatedAt, &task.UpdatedAt, &task.CompletedAt,
		); err != nil {
			return nil, fmt.Errorf("scan image task: %w", err)
		}
		tasks = append(tasks, task)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate image tasks: %w", err)
	}
	return tasks, nil
}

func (s *Service) RecoverStaleTasks(ctx context.Context, logger *slog.Logger) {
	result, err := s.db.ExecContext(ctx,
		`UPDATE playground_image_tasks
		 SET status = 'failed', error_message = 'generation timed out, please retry', updated_at = NOW(), completed_at = NOW()
		 WHERE (status = 'pending' AND created_at < NOW() - INTERVAL '5 minutes')
		    OR (status = 'processing' AND updated_at < NOW() - INTERVAL '5 minutes')`,
	)
	if err != nil {
		logger.Warn("failed to recover stale tasks", "error", err)
		return
	}
	if n, _ := result.RowsAffected(); n > 0 {
		logger.Info("recovered stale image tasks", "count", n)
	}
}

func (s *Service) ProcessPendingImageTasks(ctx context.Context, host sdk.Host, logger *slog.Logger) error {
	s.RecoverStaleTasks(ctx, logger)

	rows, err := s.db.QueryContext(ctx,
		`UPDATE playground_image_tasks SET status = 'processing', updated_at = NOW()
		 WHERE id IN (
		     SELECT id FROM playground_image_tasks
		     WHERE status = 'pending'
		     ORDER BY created_at
		     LIMIT 5
		 )
		 RETURNING id, user_id, conversation_id, platform, model, prompt, image_size, group_id`,
	)
	if err != nil {
		return fmt.Errorf("claim pending tasks: %w", err)
	}

	var tasks []ImageTask
	for rows.Next() {
		var t ImageTask
		if err := rows.Scan(&t.ID, &t.UserID, &t.ConversationID, &t.Platform, &t.Model, &t.Prompt, &t.ImageSize, &t.GroupID); err != nil {
			return fmt.Errorf("scan pending task: %w", err)
		}
		tasks = append(tasks, t)
	}
	if err := rows.Err(); err != nil {
		_ = rows.Close()
		return fmt.Errorf("iterate pending tasks: %w", err)
	}
	if err := rows.Close(); err != nil {
		return fmt.Errorf("close pending task rows: %w", err)
	}

	var wg sync.WaitGroup
	for _, task := range tasks {
		wg.Add(1)
		go func(t ImageTask) {
			defer wg.Done()
			s.processOneImageTask(ctx, host, logger, t)
		}(task)
	}
	wg.Wait()
	return nil
}

type imageGenerationParams struct {
	TaskID         int64
	UserID         int64
	ConversationID int64
	GroupID        int64
	Platform       string
	Model          string
	Prompt         string
	ImageSize      string
	Mode           string
	SourceImage    string
	Mask           string
}

type imageGenerationResult struct {
	Content      string
	InputTokens  int
	OutputTokens int
	Cost         float64
	Model        string
}

func (s *Service) processOneImageTask(ctx context.Context, host sdk.Host, logger *slog.Logger, task ImageTask) {
	logger.Info("processing image task", "task_id", task.ID, "model", task.Model, "platform", task.Platform)
	now := time.Now()

	result, err := s.executeImageGeneration(ctx, host, logger, imageGenerationParams{
		TaskID:         task.ID,
		UserID:         int64(task.UserID),
		ConversationID: task.ConversationID,
		GroupID:        task.GroupID,
		Platform:       task.Platform,
		Model:          task.Model,
		Prompt:         task.Prompt,
		ImageSize:      task.ImageSize,
	})
	if err != nil {
		s.failTask(ctx, task.ID, err.Error(), now)
		return
	}

	if task.ConversationID > 0 {
		if _, err := s.saveMessage(ctx, task.ConversationID, "assistant", result.Content, "", "", task.Platform, result.Model, task.GroupID, result.InputTokens, result.OutputTokens, result.Cost); err != nil {
			logger.Error("failed to persist task assistant message", "task_id", task.ID, "error", err)
			s.failTask(ctx, task.ID, "failed to persist result", now)
			return
		}
	}

	if _, err := s.db.ExecContext(ctx,
		`UPDATE playground_image_tasks
			 SET status = 'completed', result_content = $1, input_tokens = $2, output_tokens = $3,
			     cost = $4, updated_at = $5, completed_at = $5
			 WHERE id = $6`,
		result.Content, result.InputTokens, result.OutputTokens, result.Cost, now, task.ID,
	); err != nil {
		logger.Error("failed to mark task completed", "task_id", task.ID, "error", err)
	}

	if task.ConversationID > 0 {
		if _, err := s.db.ExecContext(ctx, "UPDATE playground_conversations SET updated_at = NOW() WHERE id = $1", task.ConversationID); err != nil {
			logger.Warn("failed to refresh conversation timestamp", "error", err, "conv_id", task.ConversationID)
		}
	}

	logger.Info("image task completed", "task_id", task.ID)
}

func (s *Service) executeImageGeneration(ctx context.Context, host sdk.Host, logger *slog.Logger, params imageGenerationParams) (*imageGenerationResult, error) {
	mode := params.Mode
	if mode == "" {
		mode = "text2img"
	}
	switch mode {
	case "text2img":
		return s.executeChatImage(ctx, host, logger, params)
	case "img2img":
		return s.executeChatImage(ctx, host, logger, params)
	case "inpaint":
		return s.executeInpaint(ctx, host, logger, params)
	default:
		return nil, fmt.Errorf("unsupported mode: %s", mode)
	}
}

// executeChatImage 处理 text2img 和 img2img 模式，统一走 /v1/chat/completions。
func (s *Service) executeChatImage(ctx context.Context, host sdk.Host, logger *slog.Logger, params imageGenerationParams) (*imageGenerationResult, error) {
	var messageContent any
	if params.Mode == "img2img" && params.SourceImage != "" {
		messageContent = []map[string]any{
			{"type": "image_url", "image_url": map[string]any{"url": params.SourceImage}},
			{"type": "text", "text": params.Prompt},
		}
	} else {
		messageContent = params.Prompt
	}

	reqBody := map[string]any{
		"model": params.Model,
		"messages": []map[string]any{
			{"role": "user", "content": messageContent},
		},
		"stream": false,
	}
	if params.ImageSize != "" && params.ImageSize != "auto" {
		reqBody["size"] = params.ImageSize
	}

	body, _ := json.Marshal(reqBody)
	headers := make(http.Header)
	headers.Set("Content-Type", "application/json")
	headers.Set("Accept", "application/json")
	headers.Set("X-Airgate-Platform", params.Platform)

	resp, err := hostForward(ctx, host, hostForwardRequest{
		UserID:  params.UserID,
		GroupID: params.GroupID,
		Model:   params.Model,
		Method:  http.MethodPost,
		Path:    "/v1/chat/completions",
		Headers: headers,
		Body:    body,
		Stream:  false,
	})
	if err != nil {
		logger.Error("image task upstream failed", "task_id", params.TaskID, "error", err)
		return nil, err
	}

	return s.parseChatImageResponse(ctx, logger, params, resp)
}

// executeInpaint 处理局部绘图模式，走 /v1/images/edits multipart。
func (s *Service) executeInpaint(ctx context.Context, host sdk.Host, logger *slog.Logger, params imageGenerationParams) (*imageGenerationResult, error) {
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)

	if err := writeDataURLFormFile(w, "image", "image.png", params.SourceImage); err != nil {
		return nil, fmt.Errorf("failed to write image field: %w", err)
	}
	if params.Mask != "" {
		if err := writeDataURLFormFile(w, "mask", "mask.png", params.Mask); err != nil {
			return nil, fmt.Errorf("failed to write mask field: %w", err)
		}
	}
	_ = w.WriteField("prompt", params.Prompt)
	_ = w.WriteField("model", params.Model)
	if params.ImageSize != "" && params.ImageSize != "auto" {
		_ = w.WriteField("size", params.ImageSize)
	}
	_ = w.Close()

	headers := make(http.Header)
	headers.Set("Content-Type", w.FormDataContentType())
	headers.Set("Accept", "application/json")
	headers.Set("X-Airgate-Platform", params.Platform)
	headers.Set("X-Airgate-Task-Execution", "true")

	resp, err := hostForward(ctx, host, hostForwardRequest{
		UserID:  params.UserID,
		GroupID: params.GroupID,
		Model:   params.Model,
		Method:  http.MethodPost,
		Path:    "/v1/images/edits",
		Headers: headers,
		Body:    buf.Bytes(),
		Stream:  false,
	})
	if err != nil {
		logger.Error("inpaint upstream failed", "task_id", params.TaskID, "error", err)
		return nil, err
	}

	return s.parseImagesAPIResponse(ctx, logger, params, resp)
}

// parseChatImageResponse 解析 /v1/chat/completions 响应，提取 markdown 图片内容。
func (s *Service) parseChatImageResponse(ctx context.Context, logger *slog.Logger, params imageGenerationParams, resp *hostForwardResponse) (*imageGenerationResult, error) {
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, parseUpstreamError(resp, params.TaskID, logger)
	}

	storedBody := resp.Body
	if s.storage != nil {
		if sb, err := storeResponseImageAssets(ctx, s.storage, s.db, int(params.UserID), params.ConversationID, resp.Body); err != nil {
			logger.Warn("failed to store task image assets", "task_id", params.TaskID, "error", err)
		} else {
			storedBody = sb
		}
	}

	var chatResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Usage struct {
			PromptTokens     int     `json:"prompt_tokens"`
			CompletionTokens int     `json:"completion_tokens"`
			InputTokens      int     `json:"input_tokens"`
			OutputTokens     int     `json:"output_tokens"`
			Cost             float64 `json:"cost"`
		} `json:"usage"`
		Model string `json:"model"`
	}
	if err := json.Unmarshal(storedBody, &chatResp); err != nil {
		logger.Error("failed to parse task response", "task_id", params.TaskID, "error", err)
		return nil, fmt.Errorf("failed to parse response")
	}

	content := ""
	if len(chatResp.Choices) > 0 {
		content = chatResp.Choices[0].Message.Content
	}
	if content == "" {
		return nil, fmt.Errorf("empty response from model")
	}

	inputTokens := chatResp.Usage.PromptTokens
	if inputTokens == 0 {
		inputTokens = chatResp.Usage.InputTokens
	}
	outputTokens := chatResp.Usage.CompletionTokens
	if outputTokens == 0 {
		outputTokens = chatResp.Usage.OutputTokens
	}
	respModel := chatResp.Model
	if respModel == "" {
		respModel = params.Model
	}

	return &imageGenerationResult{
		Content:      content,
		InputTokens:  inputTokens,
		OutputTokens: outputTokens,
		Cost:         chatResp.Usage.Cost,
		Model:        respModel,
	}, nil
}

// parseImagesAPIResponse 解析 /v1/images/edits 响应，将 data[].url 组装为 markdown。
func (s *Service) parseImagesAPIResponse(ctx context.Context, logger *slog.Logger, params imageGenerationParams, resp *hostForwardResponse) (*imageGenerationResult, error) {
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, parseUpstreamError(resp, params.TaskID, logger)
	}

	storedBody := resp.Body
	if s.storage != nil {
		if sb, err := storeResponseImageAssets(ctx, s.storage, s.db, int(params.UserID), params.ConversationID, resp.Body); err != nil {
			logger.Warn("failed to store inpaint image assets", "task_id", params.TaskID, "error", err)
		} else {
			storedBody = sb
		}
	}

	var imagesResp struct {
		Data []struct {
			URL           string `json:"url"`
			B64JSON       string `json:"b64_json"`
			RevisedPrompt string `json:"revised_prompt"`
		} `json:"data"`
		Usage struct {
			InputTokens  int     `json:"input_tokens"`
			OutputTokens int     `json:"output_tokens"`
			Cost         float64 `json:"cost"`
		} `json:"usage"`
		Model string `json:"model"`
	}
	if err := json.Unmarshal(storedBody, &imagesResp); err != nil {
		logger.Error("failed to parse inpaint response", "task_id", params.TaskID, "error", err)
		return nil, fmt.Errorf("failed to parse response")
	}

	var sb strings.Builder
	for _, item := range imagesResp.Data {
		imgURL := item.URL
		if imgURL == "" {
			continue
		}
		sb.WriteString(fmt.Sprintf("![image](%s)\n", imgURL))
	}
	content := strings.TrimSpace(sb.String())
	if content == "" {
		return nil, fmt.Errorf("no images in response")
	}

	respModel := imagesResp.Model
	if respModel == "" {
		respModel = params.Model
	}

	return &imageGenerationResult{
		Content:      content,
		InputTokens:  imagesResp.Usage.InputTokens,
		OutputTokens: imagesResp.Usage.OutputTokens,
		Cost:         imagesResp.Usage.Cost,
		Model:        respModel,
	}, nil
}

func parseUpstreamError(resp *hostForwardResponse, taskID int64, logger *slog.Logger) error {
	errMsg := fmt.Sprintf("upstream returned %d", resp.StatusCode)
	var errBody struct {
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if json.Unmarshal(resp.Body, &errBody) == nil && errBody.Error.Message != "" {
		errMsg = errBody.Error.Message
	}
	logger.Error("image task upstream error", "task_id", taskID, "status", resp.StatusCode, "error", errMsg)
	return fmt.Errorf("%s", errMsg)
}

// writeDataURLFormFile 将 data URL 解码并写入 multipart form 文件字段。
func writeDataURLFormFile(w *multipart.Writer, fieldName, fileName, dataURL string) error {
	if !strings.HasPrefix(dataURL, "data:") {
		part, err := w.CreateFormFile(fieldName, fileName)
		if err != nil {
			return err
		}
		_, err = part.Write([]byte(dataURL))
		return err
	}
	commaIdx := strings.Index(dataURL, ",")
	if commaIdx < 0 {
		return fmt.Errorf("invalid data URL")
	}
	raw, err := base64.StdEncoding.DecodeString(dataURL[commaIdx+1:])
	if err != nil {
		return err
	}
	part, err := w.CreateFormFile(fieldName, fileName)
	if err != nil {
		return err
	}
	_, err = part.Write(raw)
	return err
}

func (s *Service) failTask(ctx context.Context, taskID int64, errMsg string, now time.Time) {
	_, _ = s.db.ExecContext(ctx,
		`UPDATE playground_image_tasks
		 SET status = 'failed', error_message = $1, updated_at = $2, completed_at = $2
		 WHERE id = $3`,
		errMsg, now, taskID,
	)
}

func storeResponseImageAssets(ctx context.Context, storage *ObjectStorage, db *sql.DB, userID int, convID int64, body []byte) ([]byte, error) {
	var parsed any
	if err := json.Unmarshal(body, &parsed); err != nil {
		return body, err
	}
	converted, err := convertResponseValueForStorage(ctx, storage, db, userID, convID, parsed)
	if err != nil {
		return body, err
	}
	result, err := json.Marshal(converted)
	if err != nil {
		return body, err
	}
	return result, nil
}

func convertResponseValueForStorage(ctx context.Context, storage *ObjectStorage, db *sql.DB, userID int, convID int64, v any) (any, error) {
	switch val := v.(type) {
	case map[string]any:
		if b64, ok := val["b64_json"].(string); ok && b64 != "" {
			asset, err := storage.StoreImageBase64(ctx, userID, convID, "image/png", b64)
			if err != nil {
				return val, err
			}
			if _, err := db.ExecContext(ctx,
				`INSERT INTO playground_assets (id, user_id, conversation_id, object_key, content_type, size_bytes)
				 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
				asset.ID, userID, convID, asset.ObjectKey, asset.ContentType, asset.SizeBytes,
			); err != nil {
				return val, err
			}
			publicURL, err := storage.PublicURL(ctx, asset.ObjectKey)
			if err != nil {
				return val, err
			}
			delete(val, "b64_json")
			val["url"] = publicURL
		}
		for k, child := range val {
			converted, err := convertResponseValueForStorage(ctx, storage, db, userID, convID, child)
			if err != nil {
				return val, err
			}
			val[k] = converted
		}
		return val, nil
	case []any:
		for i, child := range val {
			converted, err := convertResponseValueForStorage(ctx, storage, db, userID, convID, child)
			if err != nil {
				return val, err
			}
			val[i] = converted
		}
		return val, nil
	default:
		return v, nil
	}
}

func updateCoreTask(ctx context.Context, host sdk.Host, logger *slog.Logger, req hostUpdateTaskRequest) error {
	if err := hostUpdateTask(ctx, host, req); err != nil {
		logger.Error("core_task_update_failed", "task_id", req.TaskID, "status", req.Status, "error", err)
		return err
	}
	return nil
}

type imageGenerationInput struct {
	ConversationID int64  `json:"conversation_id"`
	Platform       string `json:"platform"`
	Model          string `json:"model"`
	Prompt         string `json:"prompt"`
	ImageSize      string `json:"image_size"`
	GroupID        int64  `json:"group_id"`
	Mode           string `json:"mode"`
	SourceImage    string `json:"source_image"`
	Mask           string `json:"mask"`
}

// ProcessCoreTask 处理 Core 分发的异步任务。实现 TaskProcessor 接口。
func (s *Service) ProcessCoreTask(ctx context.Context, host sdk.Host, logger *slog.Logger, task sdk.HostTask) error {
	logger.Info("processing core task", "task_id", task.ID, "task_type", task.TaskType)

	inputJSON, err := json.Marshal(task.Input)
	if err != nil {
		return err
	}
	var input imageGenerationInput
	if err := json.Unmarshal(inputJSON, &input); err != nil {
		_ = updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{TaskID: task.ID, Status: sdk.TaskStatusFailed, ErrorMessage: "invalid task input"})
		return fmt.Errorf("invalid task input: %w", err)
	}
	if input.Platform == "" || input.Model == "" || strings.TrimSpace(input.Prompt) == "" {
		_ = updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{TaskID: task.ID, Status: sdk.TaskStatusFailed, ErrorMessage: "platform, model, and prompt are required"})
		return fmt.Errorf("platform, model, and prompt are required")
	}

	if err := updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{TaskID: task.ID, Status: sdk.TaskStatusProcessing, Progress: 10}); err != nil {
		return err
	}

	result, err := s.executeImageGeneration(ctx, host, logger, imageGenerationParams{
		TaskID:         task.ID,
		UserID:         task.UserID,
		ConversationID: input.ConversationID,
		GroupID:        input.GroupID,
		Platform:       input.Platform,
		Model:          input.Model,
		Prompt:         input.Prompt,
		ImageSize:      input.ImageSize,
		Mode:           input.Mode,
		SourceImage:    input.SourceImage,
		Mask:           input.Mask,
	})
	if err != nil {
		_ = updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{TaskID: task.ID, Status: sdk.TaskStatusFailed, ErrorMessage: err.Error()})
		return err
	}

	if err := updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{TaskID: task.ID, Status: sdk.TaskStatusProcessing, Progress: 70}); err != nil {
		return err
	}

	if input.ConversationID > 0 {
		if _, err := s.saveMessage(ctx, input.ConversationID, "assistant", result.Content, "", "", input.Platform, result.Model, input.GroupID, result.InputTokens, result.OutputTokens, result.Cost); err != nil {
			logger.Error("failed to persist core task assistant message", "task_id", task.ID, "error", err)
			_ = updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{TaskID: task.ID, Status: sdk.TaskStatusFailed, ErrorMessage: "failed to persist result"})
			return fmt.Errorf("failed to persist result: %w", err)
		}
		if _, err := s.db.ExecContext(ctx, "UPDATE playground_conversations SET updated_at = NOW() WHERE id = $1", input.ConversationID); err != nil {
			logger.Warn("failed to refresh conversation timestamp", "error", err, "conv_id", input.ConversationID)
		}
	}

	if err := updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{
		TaskID:   task.ID,
		Status:   sdk.TaskStatusCompleted,
		Progress: 100,
		Output: map[string]interface{}{
			"content":       result.Content,
			"input_tokens":  result.InputTokens,
			"output_tokens": result.OutputTokens,
			"cost":          result.Cost,
			"model":         result.Model,
		},
	}); err != nil {
		return err
	}

	logger.Info("core task completed", "task_id", task.ID)
	return nil
}
