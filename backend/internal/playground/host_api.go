package playground

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

const (
	hostMethodGatewayForward = "gateway.forward"
	hostMethodPlatformsList  = "platforms.list"
	hostMethodModelsList     = "models.list"
	hostMethodUsersGet       = "users.get"
	hostMethodAssetsStore    = "assets.store"
	hostMethodAssetsGetURL   = "assets.get_url"
	hostMethodAssetsGetBytes = "assets.get_bytes"
	hostMethodTasksCreate    = "tasks.create"
	hostMethodTasksUpdate    = "tasks.update"
	hostMethodTasksGet       = "tasks.get"
	hostMethodTasksList      = "tasks.list"
)

type hostForwardRequest struct {
	UserID  int64
	GroupID int64
	Model   string
	Method  string
	Path    string
	Headers http.Header
	Body    []byte
	Stream  bool
}

type hostForwardResponse struct {
	StatusCode int
	Headers    http.Header
	Body       []byte
	Usage      *sdk.Usage
}

type hostForwardChunk struct {
	Done       bool
	StatusCode int
	Headers    http.Header
	Data       []byte
}

type hostTaskListResult struct {
	Tasks []*sdk.HostTask
	Total int
}

type hostUpdateTaskRequest struct {
	TaskID       int64
	Status       sdk.TaskStatus
	Progress     int
	Output       map[string]interface{}
	ErrorMessage string
}

type hostAssetBytes struct {
	Data        []byte
	ContentType string
}

func hostInvoke(ctx context.Context, host sdk.Host, method string, payload map[string]interface{}) (map[string]interface{}, error) {
	if host == nil {
		return nil, fmt.Errorf("core host 未启用")
	}
	resp, err := host.Invoke(ctx, sdk.HostInvokeRequest{
		Method:  method,
		Payload: payload,
	})
	if err != nil {
		return nil, err
	}
	if resp == nil {
		return map[string]interface{}{}, nil
	}
	if strings.EqualFold(resp.Status, "error") {
		if msg, _ := resp.Payload["message"].(string); msg != "" {
			return nil, fmt.Errorf("%s", msg)
		}
		return nil, fmt.Errorf("core 方法 %s 返回错误", method)
	}
	return resp.Payload, nil
}

func hostForward(ctx context.Context, host sdk.Host, req hostForwardRequest) (*hostForwardResponse, error) {
	payload, err := hostInvoke(ctx, host, hostMethodGatewayForward, hostForwardPayload(req))
	if err != nil {
		return nil, err
	}
	return &hostForwardResponse{
		StatusCode: intFromAny(firstPayloadValue(payload, "status_code", "status")),
		Headers:    headerFromPayload(firstPayloadValue(payload, "headers")),
		Body:       bytesFromPayload(firstPayloadValue(payload, "body")),
		Usage:      usageFromPayload(firstPayloadValue(payload, "usage")),
	}, nil
}

func hostForwardStream(ctx context.Context, host sdk.Host, req hostForwardRequest, onChunk func(hostForwardChunk) error) error {
	if host == nil {
		return fmt.Errorf("core host 未启用")
	}
	req.Stream = true
	stream, err := host.InvokeStream(ctx, sdk.HostStreamRequest{
		Method:  hostMethodGatewayForward,
		Payload: hostForwardPayload(req),
	})
	if err != nil {
		return err
	}
	defer func() { _ = stream.CloseSend() }()

	for {
		frame, err := stream.Recv()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}
		payload := frame.Payload
		chunk := hostForwardChunk{
			Done:       frame.Done,
			StatusCode: intFromAny(firstPayloadValue(payload, "status_code", "status")),
			Headers:    headerFromPayload(firstPayloadValue(payload, "headers")),
			Data:       bytesFromPayload(firstPayloadValue(payload, "data")),
		}
		if err := onChunk(chunk); err != nil {
			return err
		}
	}
}

func hostForwardPayload(req hostForwardRequest) map[string]interface{} {
	return map[string]interface{}{
		"user_id":  req.UserID,
		"group_id": req.GroupID,
		"model":    req.Model,
		"method":   req.Method,
		"path":     req.Path,
		"headers":  headerPayload(req.Headers),
		"body":     string(req.Body),
		"stream":   req.Stream,
	}
}

func hostCreateTask(ctx context.Context, host sdk.Host, taskType string, userID int64, input map[string]interface{}) (*sdk.HostTask, error) {
	payload, err := hostInvoke(ctx, host, hostMethodTasksCreate, map[string]interface{}{
		"task_type": taskType,
		"user_id":   userID,
		"input":     input,
	})
	if err != nil {
		return nil, err
	}
	return hostTaskFromPayload(firstPayloadValue(payload, "task", "data", "result", ""))
}

func hostUpdateTask(ctx context.Context, host sdk.Host, req hostUpdateTaskRequest) error {
	payload := map[string]interface{}{
		"task_id": req.TaskID,
	}
	if req.Status != "" {
		payload["status"] = req.Status.String()
	}
	if req.Progress > 0 {
		payload["progress"] = req.Progress
	}
	if req.Output != nil {
		payload["output"] = req.Output
	}
	if req.ErrorMessage != "" {
		payload["error_message"] = req.ErrorMessage
	}
	_, err := hostInvoke(ctx, host, hostMethodTasksUpdate, payload)
	return err
}

func hostGetTask(ctx context.Context, host sdk.Host, taskID int64) (*sdk.HostTask, error) {
	payload, err := hostInvoke(ctx, host, hostMethodTasksGet, map[string]interface{}{"task_id": taskID})
	if err != nil {
		return nil, err
	}
	return hostTaskFromPayload(firstPayloadValue(payload, "task", "data", "result", ""))
}

func hostListTasks(ctx context.Context, host sdk.Host, userID int64, taskType string, limit int) (*hostTaskListResult, error) {
	payload, err := hostInvoke(ctx, host, hostMethodTasksList, map[string]interface{}{
		"user_id":   userID,
		"task_type": taskType,
		"limit":     limit,
	})
	if err != nil {
		return nil, err
	}
	out := &hostTaskListResult{Total: intFromAny(firstPayloadValue(payload, "total", "count"))}
	if tasks, ok := firstPayloadValue(payload, "tasks", "items", "data").([]interface{}); ok {
		for _, item := range tasks {
			task, err := hostTaskFromPayload(item)
			if err != nil {
				return nil, err
			}
			out.Tasks = append(out.Tasks, task)
		}
	}
	if out.Total == 0 {
		out.Total = len(out.Tasks)
	}
	return out, nil
}

func hostListPlatforms(ctx context.Context, host sdk.Host) ([]map[string]interface{}, error) {
	payload, err := hostInvoke(ctx, host, hostMethodPlatformsList, nil)
	if err != nil {
		return nil, err
	}
	items, ok := firstPayloadValue(payload, "platforms", "items", "data").([]interface{})
	if !ok {
		return []map[string]interface{}{}, nil
	}
	out := make([]map[string]interface{}, 0, len(items))
	for _, item := range items {
		if m, ok := mapFromAny(item); ok {
			out = append(out, m)
		}
	}
	return out, nil
}

func hostListModels(ctx context.Context, host sdk.Host, platform string) ([]sdk.ModelInfo, error) {
	payload, err := hostInvoke(ctx, host, hostMethodModelsList, map[string]interface{}{"platform": platform})
	if err != nil {
		return nil, err
	}
	items, ok := firstPayloadValue(payload, "models", "items", "data").([]interface{})
	if !ok {
		return []sdk.ModelInfo{}, nil
	}
	out := make([]sdk.ModelInfo, 0, len(items))
	for _, item := range items {
		body, err := json.Marshal(item)
		if err != nil {
			return nil, err
		}
		var model sdk.ModelInfo
		if err := json.Unmarshal(body, &model); err != nil {
			return nil, err
		}
		out = append(out, model)
	}
	return out, nil
}

func hostGetUserInfo(ctx context.Context, host sdk.Host, userID int64) (map[string]interface{}, error) {
	return hostInvoke(ctx, host, hostMethodUsersGet, map[string]interface{}{"user_id": userID})
}

func hostStoreAsset(ctx context.Context, host sdk.Host, userID int64, scope, contentType, fileExtension string, data []byte) (*StoredAsset, error) {
	payload, err := hostInvoke(ctx, host, hostMethodAssetsStore, map[string]interface{}{
		"user_id":        userID,
		"scope":          scope,
		"content_type":   contentType,
		"file_extension": fileExtension,
		"data":           data,
	})
	if err != nil {
		return nil, err
	}
	return &StoredAsset{
		ID:          stringFromAny(firstPayloadValue(payload, "asset_id", "id")),
		ObjectKey:   stringFromAny(firstPayloadValue(payload, "object_key")),
		PublicURL:   stringFromAny(firstPayloadValue(payload, "public_url")),
		ContentType: stringFromAny(firstPayloadValue(payload, "content_type")),
		SizeBytes:   int64FromAny(firstPayloadValue(payload, "size_bytes")),
	}, nil
}

func hostGetAssetURL(ctx context.Context, host sdk.Host, objectKey string) (string, error) {
	payload, err := hostInvoke(ctx, host, hostMethodAssetsGetURL, map[string]interface{}{"object_key": objectKey})
	if err != nil {
		return "", err
	}
	return stringFromAny(firstPayloadValue(payload, "public_url", "url")), nil
}

func hostGetAssetBytes(ctx context.Context, host sdk.Host, objectKey string) (*hostAssetBytes, error) {
	payload, err := hostInvoke(ctx, host, hostMethodAssetsGetBytes, map[string]interface{}{"object_key": objectKey})
	if err != nil {
		return nil, err
	}
	return &hostAssetBytes{
		Data:        bytesFromPayload(firstPayloadValue(payload, "data")),
		ContentType: stringFromAny(firstPayloadValue(payload, "content_type")),
	}, nil
}

func firstPayloadValue(payload map[string]interface{}, keys ...string) interface{} {
	if payload == nil {
		return nil
	}
	for _, key := range keys {
		if key == "" {
			return payload
		}
		if value, ok := payload[key]; ok {
			return value
		}
	}
	return nil
}

func hostTaskFromPayload(value interface{}) (*sdk.HostTask, error) {
	m, ok := mapFromAny(value)
	if !ok {
		return nil, fmt.Errorf("core 返回的任务结构无效")
	}
	task := &sdk.HostTask{
		ID:           int64FromAny(firstPayloadValue(m, "id", "task_id")),
		PluginID:     stringFromAny(firstPayloadValue(m, "plugin_id")),
		TaskType:     stringFromAny(firstPayloadValue(m, "task_type", "type")),
		Status:       sdk.TaskStatus(stringFromAny(firstPayloadValue(m, "status"))),
		UserID:       int64FromAny(firstPayloadValue(m, "user_id")),
		Input:        mapValueFromAny(firstPayloadValue(m, "input")),
		Output:       mapValueFromAny(firstPayloadValue(m, "output")),
		ErrorMessage: stringFromAny(firstPayloadValue(m, "error_message", "error")),
		Progress:     intFromAny(firstPayloadValue(m, "progress")),
		Attempts:     intFromAny(firstPayloadValue(m, "attempts")),
		MaxAttempts:  intFromAny(firstPayloadValue(m, "max_attempts")),
		CreatedAt:    timeFromAny(firstPayloadValue(m, "created_at")),
		UpdatedAt:    timeFromAny(firstPayloadValue(m, "updated_at")),
	}
	task.StartedAt = timePtrFromAny(firstPayloadValue(m, "started_at"))
	task.CompletedAt = timePtrFromAny(firstPayloadValue(m, "completed_at"))
	return task, nil
}

func headerPayload(headers http.Header) map[string]interface{} {
	out := make(map[string]interface{}, len(headers))
	for key, values := range headers {
		out[key] = append([]string(nil), values...)
	}
	return out
}

func headerFromPayload(value interface{}) http.Header {
	headers := http.Header{}
	m, ok := mapFromAny(value)
	if !ok {
		return headers
	}
	for key, raw := range m {
		switch values := raw.(type) {
		case []interface{}:
			for _, item := range values {
				headers.Add(key, stringFromAny(item))
			}
		case []string:
			for _, item := range values {
				headers.Add(key, item)
			}
		default:
			if s := stringFromAny(values); s != "" {
				headers.Set(key, s)
			}
		}
	}
	return headers
}

func bytesFromPayload(value interface{}) []byte {
	switch v := value.(type) {
	case nil:
		return nil
	case []byte:
		return v
	case string:
		if decoded, err := base64.StdEncoding.DecodeString(v); err == nil && looksLikeJSON(decoded) {
			return decoded
		}
		return []byte(v)
	default:
		body, _ := json.Marshal(v)
		return body
	}
}

func looksLikeJSON(body []byte) bool {
	trimmed := strings.TrimSpace(string(body))
	return strings.HasPrefix(trimmed, "{") || strings.HasPrefix(trimmed, "[")
}

func usageFromPayload(value interface{}) *sdk.Usage {
	if value == nil {
		return nil
	}
	body, err := json.Marshal(value)
	if err != nil {
		return nil
	}
	var usage sdk.Usage
	if err := json.Unmarshal(body, &usage); err != nil {
		return nil
	}
	return &usage
}

func mapFromAny(value interface{}) (map[string]interface{}, bool) {
	if value == nil {
		return nil, false
	}
	if m, ok := value.(map[string]interface{}); ok {
		return m, true
	}
	body, err := json.Marshal(value)
	if err != nil {
		return nil, false
	}
	var out map[string]interface{}
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, false
	}
	return out, true
}

func mapValueFromAny(value interface{}) map[string]interface{} {
	m, _ := mapFromAny(value)
	return m
}

func stringFromAny(value interface{}) string {
	switch v := value.(type) {
	case string:
		return v
	case fmt.Stringer:
		return v.String()
	case nil:
		return ""
	default:
		return fmt.Sprint(v)
	}
}

func intFromAny(value interface{}) int {
	return int(int64FromAny(value))
}

func int64FromAny(value interface{}) int64 {
	switch v := value.(type) {
	case int:
		return int64(v)
	case int64:
		return v
	case int32:
		return int64(v)
	case float64:
		return int64(v)
	case float32:
		return int64(v)
	case json.Number:
		n, _ := v.Int64()
		return n
	case string:
		n, _ := strconv.ParseInt(v, 10, 64)
		return n
	default:
		return 0
	}
}

func timeFromAny(value interface{}) time.Time {
	if value == nil {
		return time.Time{}
	}
	if t, ok := value.(time.Time); ok {
		return t
	}
	raw := strings.TrimSpace(stringFromAny(value))
	if raw == "" {
		return time.Time{}
	}
	if ts, err := time.Parse(time.RFC3339Nano, raw); err == nil {
		return ts
	}
	if unix, err := strconv.ParseInt(raw, 10, 64); err == nil && unix > 0 {
		return time.Unix(unix, 0)
	}
	return time.Time{}
}

func timePtrFromAny(value interface{}) *time.Time {
	ts := timeFromAny(value)
	if ts.IsZero() {
		return nil
	}
	return &ts
}
