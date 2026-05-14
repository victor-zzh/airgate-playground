package playground

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

const generationTaskType = "generation"

type GenerationInputAsset struct {
	Type string `json:"type"`
	Role string `json:"role"`
	URL  string `json:"url"`
}

type CreateGenerationTaskRequest struct {
	ConversationID int64                  `json:"conversation_id"`
	Kind           string                 `json:"kind"`
	Operation      string                 `json:"operation"`
	Platform       string                 `json:"platform"`
	Model          string                 `json:"model"`
	Prompt         string                 `json:"prompt"`
	GroupID        int64                  `json:"group_id,omitempty"`
	Parameters     map[string]interface{} `json:"parameters,omitempty"`
	Inputs         []GenerationInputAsset `json:"inputs,omitempty"`
	Mask           *GenerationInputAsset  `json:"mask,omitempty"`
	MessageContent string                 `json:"message_content,omitempty"`
	ClientContext  map[string]interface{} `json:"client_context,omitempty"`
}

type generationTaskInput struct {
	ConversationID int64                  `json:"conversation_id"`
	Kind           string                 `json:"kind"`
	Operation      string                 `json:"operation"`
	Platform       string                 `json:"platform"`
	Model          string                 `json:"model"`
	Prompt         string                 `json:"prompt"`
	GroupID        int64                  `json:"group_id"`
	Parameters     map[string]interface{} `json:"parameters,omitempty"`
	Inputs         []GenerationInputAsset `json:"inputs,omitempty"`
	Mask           *GenerationInputAsset  `json:"mask,omitempty"`
	MessageContent string                 `json:"message_content,omitempty"`
	ClientContext  map[string]interface{} `json:"client_context,omitempty"`
}

type generationResult struct {
	Content      string
	Model        string
	InputTokens  int
	OutputTokens int
	Cost         float64
	UsageID      int
}

func normalizeGenerationRequest(req *CreateGenerationTaskRequest) {
	req.Kind = strings.TrimSpace(req.Kind)
	if req.Kind == "" {
		req.Kind = "image"
	}
	req.Operation = strings.TrimSpace(req.Operation)
	if req.Operation == "" {
		req.Operation = "generate"
	}
	req.Platform = strings.TrimSpace(req.Platform)
	req.Model = strings.TrimSpace(req.Model)
	req.Prompt = strings.TrimSpace(req.Prompt)
	if req.Parameters == nil {
		req.Parameters = map[string]interface{}{}
	}
}

func generationTaskInputMap(req CreateGenerationTaskRequest, groupID int64) map[string]interface{} {
	return map[string]interface{}{
		"conversation_id": req.ConversationID,
		"kind":            req.Kind,
		"operation":       req.Operation,
		"platform":        req.Platform,
		"model":           req.Model,
		"prompt":          req.Prompt,
		"group_id":        groupID,
		"parameters":      req.Parameters,
		"inputs":          req.Inputs,
		"mask":            req.Mask,
		"message_content": req.MessageContent,
		"client_context":  req.ClientContext,
	}
}

func generationTaskAttributes(req CreateGenerationTaskRequest, groupID int64) map[string]interface{} {
	attrs := map[string]interface{}{
		"kind":      req.Kind,
		"operation": req.Operation,
		"platform":  req.Platform,
		"model":     req.Model,
		"group_id":  groupID,
	}
	for _, key := range []string{"size", "quality", "duration_seconds", "resolution", "aspect_ratio"} {
		if value, ok := req.Parameters[key]; ok && value != nil && fmt.Sprint(value) != "" {
			attrs[key] = fmt.Sprint(value)
		}
	}
	return attrs
}

func generationInputFromTask(task sdk.HostTask) (generationTaskInput, error) {
	body, err := json.Marshal(task.Input)
	if err != nil {
		return generationTaskInput{}, err
	}
	var input generationTaskInput
	if err := json.Unmarshal(body, &input); err != nil {
		return generationTaskInput{}, err
	}
	if input.Kind == "" {
		input.Kind = "image"
	}
	if input.Operation == "" {
		input.Operation = "generate"
	}
	if input.Parameters == nil {
		input.Parameters = map[string]interface{}{}
	}
	return input, nil
}

func coreTaskToGenerationTask(t *sdk.HostTask) *GenerationTask {
	if t == nil {
		return nil
	}
	input, _ := generationInputFromTask(*t)
	task := &GenerationTask{
		ID:             t.ID,
		TaskID:         t.ID,
		UserID:         int(t.UserID),
		ConversationID: input.ConversationID,
		Kind:           input.Kind,
		Operation:      input.Operation,
		Status:         t.Status.String(),
		Platform:       input.Platform,
		Model:          stringFromMap(t.Output, "model"),
		Prompt:         input.Prompt,
		GroupID:        input.GroupID,
		Parameters:     input.Parameters,
		ResultContent:  stringFromMap(t.Output, "content"),
		ErrorMessage:   t.ErrorMessage,
		Progress:       t.Progress,
		UsageID:        intFromMap(t.Output, "usage_id"),
		CreatedAt:      t.CreatedAt,
		UpdatedAt:      t.UpdatedAt,
		CompletedAt:    t.CompletedAt,
	}
	if task.Model == "" {
		task.Model = input.Model
	}
	return task
}

func (s *Service) ProcessCoreTask(ctx context.Context, host sdk.Host, logger *slog.Logger, task sdk.HostTask) error {
	logger.Info("processing generation task", "task_id", task.ID, "task_type", task.TaskType)
	if task.TaskType != generationTaskType {
		return fmt.Errorf("unsupported task type: %s", task.TaskType)
	}

	input, err := generationInputFromTask(task)
	if err != nil {
		_ = updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{TaskID: task.ID, Status: sdk.TaskStatusFailed, ErrorMessage: "invalid task input"})
		return fmt.Errorf("invalid task input: %w", err)
	}
	if input.Platform == "" || input.Model == "" || input.Prompt == "" || input.GroupID <= 0 {
		_ = updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{TaskID: task.ID, Status: sdk.TaskStatusFailed, ErrorMessage: "platform, model, prompt, and group_id are required"})
		return fmt.Errorf("platform, model, prompt, and group_id are required")
	}

	if err := updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{
		TaskID:   task.ID,
		Status:   sdk.TaskStatusProcessing,
		Progress: 10,
		Stage:    "executing",
	}); err != nil {
		return err
	}

	result, err := s.executeGeneration(ctx, host, logger, task.ID, task.UserID, input)
	if err != nil {
		_ = updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{TaskID: task.ID, Status: sdk.TaskStatusFailed, ErrorMessage: err.Error()})
		return err
	}

	if err := updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{
		TaskID:   task.ID,
		Status:   sdk.TaskStatusProcessing,
		Progress: 70,
		Stage:    "persisting",
	}); err != nil {
		return err
	}

	if input.ConversationID > 0 {
		if _, err := s.saveMessage(ctx, input.ConversationID, "assistant", result.Content, "", "", input.Platform, result.Model, input.GroupID, result.InputTokens, result.OutputTokens, result.Cost); err != nil {
			logger.Error("failed to persist generation result", "task_id", task.ID, "error", err)
			_ = updateCoreTask(ctx, host, logger, hostUpdateTaskRequest{TaskID: task.ID, Status: sdk.TaskStatusFailed, ErrorMessage: "failed to persist result"})
			return fmt.Errorf("failed to persist result: %w", err)
		}
	}

	output := map[string]interface{}{
		"content": result.Content,
		"model":   result.Model,
	}
	if result.UsageID > 0 {
		output["usage_id"] = result.UsageID
	}
	if result.InputTokens > 0 {
		output["input_tokens"] = result.InputTokens
	}
	if result.OutputTokens > 0 {
		output["output_tokens"] = result.OutputTokens
	}
	if result.Cost > 0 {
		output["cost"] = result.Cost
	}

	update := hostUpdateTaskRequest{
		TaskID:   task.ID,
		Status:   sdk.TaskStatusCompleted,
		Progress: 100,
		Stage:    "completed",
		Output:   output,
	}
	if result.UsageID > 0 {
		update.UsageID = result.UsageID
	}
	if err := updateCoreTask(ctx, host, logger, update); err != nil {
		return err
	}

	logger.Info("generation task completed", "task_id", task.ID)
	return nil
}

func (s *Service) executeGeneration(ctx context.Context, host sdk.Host, logger *slog.Logger, taskID, userID int64, input generationTaskInput) (*generationResult, error) {
	if input.Kind != "image" {
		return nil, fmt.Errorf("unsupported generation kind: %s", input.Kind)
	}
	switch input.Operation {
	case "generate":
		return s.executeImageGenerate(ctx, host, logger, taskID, userID, input)
	case "edit", "inpaint":
		return s.executeImageEdit(ctx, host, logger, taskID, userID, input)
	default:
		return nil, fmt.Errorf("unsupported image operation: %s", input.Operation)
	}
}

func (s *Service) executeImageGenerate(ctx context.Context, host sdk.Host, logger *slog.Logger, taskID, userID int64, input generationTaskInput) (*generationResult, error) {
	bodyMap := map[string]interface{}{
		"model":  input.Model,
		"prompt": input.Prompt,
	}
	copyGenerationParameters(bodyMap, input.Parameters)
	body, _ := json.Marshal(bodyMap)

	resp, err := hostForward(ctx, host, hostForwardRequest{
		UserID:  userID,
		GroupID: input.GroupID,
		Model:   input.Model,
		Method:  http.MethodPost,
		Path:    "/v1/images/generations",
		Headers: generationForwardHeaders(input.Platform, "application/json"),
		Body:    body,
		Stream:  false,
	})
	if err != nil {
		logger.Error("generation upstream failed", "task_id", taskID, "error", err)
		return nil, err
	}
	return s.parseImagesAPIResponse(ctx, logger, taskID, userID, input, resp)
}

func (s *Service) executeImageEdit(ctx context.Context, host sdk.Host, logger *slog.Logger, taskID, userID int64, input generationTaskInput) (*generationResult, error) {
	images := generationImageInputs(input.Inputs)
	if len(images) == 0 {
		return nil, fmt.Errorf("image edit requires at least one source image")
	}
	bodyMap := map[string]interface{}{
		"model":  input.Model,
		"prompt": input.Prompt,
		"image":  images[0],
	}
	if len(images) > 1 {
		bodyMap["image"] = images
	}
	if input.Mask != nil && input.Mask.URL != "" {
		bodyMap["mask"] = input.Mask.URL
	}
	copyGenerationParameters(bodyMap, input.Parameters)
	body, _ := json.Marshal(bodyMap)

	resp, err := hostForward(ctx, host, hostForwardRequest{
		UserID:  userID,
		GroupID: input.GroupID,
		Model:   input.Model,
		Method:  http.MethodPost,
		Path:    "/v1/images/edits",
		Headers: generationForwardHeaders(input.Platform, "application/json"),
		Body:    body,
		Stream:  false,
	})
	if err != nil {
		logger.Error("image edit upstream failed", "task_id", taskID, "error", err)
		return nil, err
	}
	return s.parseImagesAPIResponse(ctx, logger, taskID, userID, input, resp)
}

func generationForwardHeaders(platform, contentType string) http.Header {
	headers := make(http.Header)
	headers.Set("Content-Type", contentType)
	headers.Set("Accept", "application/json")
	headers.Set("X-Airgate-Platform", platform)
	headers.Set("X-Airgate-Task-Execution", "true")
	return headers
}

func copyGenerationParameters(dst, params map[string]interface{}) {
	for key, value := range params {
		if key == "" || value == nil {
			continue
		}
		switch key {
		case "model", "prompt", "image", "mask":
			continue
		}
		if s, ok := value.(string); ok && strings.TrimSpace(s) == "" {
			continue
		}
		dst[key] = value
	}
}

func generationImageInputs(inputs []GenerationInputAsset) []string {
	images := make([]string, 0, len(inputs))
	for _, input := range inputs {
		if input.URL == "" {
			continue
		}
		if input.Type != "" && input.Type != "image" {
			continue
		}
		if input.Role == "mask" {
			continue
		}
		images = append(images, input.URL)
	}
	return images
}

func (s *Service) parseImagesAPIResponse(ctx context.Context, logger *slog.Logger, taskID, userID int64, input generationTaskInput, resp *hostForwardResponse) (*generationResult, error) {
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, parseUpstreamError(resp, taskID, logger)
	}

	storedBody := resp.Body
	if s.storage != nil {
		if sb, err := storeResponseImageAssets(ctx, s.storage, s.db, int(userID), input.ConversationID, resp.Body); err != nil {
			logger.Warn("failed to store generated assets", "task_id", taskID, "error", err)
		} else {
			storedBody = sb
		}
	}

	var imagesResp struct {
		Data []struct {
			URL           string `json:"url"`
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
		logger.Error("failed to parse generation response", "task_id", taskID, "error", err)
		return nil, fmt.Errorf("failed to parse response")
	}

	var sb strings.Builder
	for _, item := range imagesResp.Data {
		if item.URL == "" {
			continue
		}
		sb.WriteString(fmt.Sprintf("![image](%s)\n", item.URL))
	}
	content := strings.TrimSpace(sb.String())
	if content == "" {
		return nil, fmt.Errorf("no generated assets in response")
	}

	model := imagesResp.Model
	if resp.Usage != nil && resp.Usage.Model != "" {
		model = resp.Usage.Model
	}
	if model == "" {
		model = input.Model
	}

	result := &generationResult{
		Content:      content,
		Model:        model,
		InputTokens:  imagesResp.Usage.InputTokens,
		OutputTokens: imagesResp.Usage.OutputTokens,
		Cost:         imagesResp.Usage.Cost,
		UsageID:      resp.UsageID,
	}
	if resp.Usage != nil {
		if result.InputTokens == 0 {
			result.InputTokens = usageMetricInt(resp.Usage, "input_tokens")
		}
		if result.OutputTokens == 0 {
			result.OutputTokens = usageMetricInt(resp.Usage, "output_tokens")
		}
		if result.Cost == 0 {
			result.Cost = resp.Usage.UserCost
			if result.Cost == 0 {
				result.Cost = resp.Usage.AccountCost
			}
		}
	}
	return result, nil
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
	logger.Error("generation task upstream error", "task_id", taskID, "status", resp.StatusCode, "error", errMsg)
	return fmt.Errorf("%s", errMsg)
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
			if localURL, err := storeAndRegisterAsset(ctx, storage, db, userID, convID, func() (*StoredAsset, error) {
				return storage.StoreImageBase64(ctx, userID, convID, "image/png", b64)
			}); err == nil {
				delete(val, "b64_json")
				val["url"] = localURL
			}
		} else if rawURL, ok := val["url"].(string); ok && isExternalURL(rawURL) {
			if localURL, err := downloadAndStoreImage(ctx, storage, db, userID, convID, rawURL); err == nil {
				val["url"] = localURL
			}
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

func storeAndRegisterAsset(ctx context.Context, storage *ObjectStorage, db *sql.DB, userID int, convID int64, store func() (*StoredAsset, error)) (string, error) {
	asset, err := store()
	if err != nil {
		return "", err
	}
	_, _ = db.ExecContext(ctx,
		`INSERT INTO playground_assets (id, user_id, conversation_id, object_key, content_type, size_bytes)
		 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
		asset.ID, userID, convID, asset.ObjectKey, asset.ContentType, asset.SizeBytes,
	)
	return storage.PublicURL(ctx, asset.ObjectKey)
}

func isExternalURL(u string) bool {
	return strings.HasPrefix(u, "http://") || strings.HasPrefix(u, "https://")
}

func downloadAndStoreImage(ctx context.Context, storage *ObjectStorage, db *sql.DB, userID int, convID int64, imageURL string) (string, error) {
	return storeAndRegisterAsset(ctx, storage, db, userID, convID, func() (*StoredAsset, error) {
		return storage.StoreImageFromURL(ctx, userID, convID, imageURL)
	})
}

func usageMetricInt(usage *sdk.Usage, key string) int {
	if usage == nil {
		return 0
	}
	for _, metric := range usage.Metrics {
		if metric.Key == key {
			return int(metric.Value)
		}
	}
	return 0
}

func updateCoreTask(ctx context.Context, host sdk.Host, logger *slog.Logger, req hostUpdateTaskRequest) error {
	if err := hostUpdateTask(ctx, host, req); err != nil {
		logger.Error("core_task_update_failed", "task_id", req.TaskID, "status", req.Status, "error", err)
		return err
	}
	return nil
}

func stringFromMap(m map[string]interface{}, key string) string {
	v, _ := m[key].(string)
	return v
}

func int64FromMap(m map[string]interface{}, key string) int64 {
	switch v := m[key].(type) {
	case int64:
		return v
	case int:
		return int64(v)
	case float64:
		return int64(v)
	default:
		return 0
	}
}

func intFromMap(m map[string]interface{}, key string) int {
	return int(int64FromMap(m, key))
}

func float64FromMap(m map[string]interface{}, key string) float64 {
	switch v := m[key].(type) {
	case float64:
		return v
	case int64:
		return float64(v)
	case int:
		return float64(v)
	default:
		return 0
	}
}
