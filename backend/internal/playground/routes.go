package playground

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

const (
	headerEntry  = "X-Airgate-Entry"
	headerUserID = "X-Airgate-User-Id"

	// 转发 body 上限：历史图片资产在 rewriteChatImageAssetURLs 展开成 data URL 后，
	// 多轮会话可能持续膨胀。Anthropic /v1/messages 请求上限 32MB，这里预留余量提前拦截，
	// 避免把注定失败的大请求推给上游。
	maxChatForwardBodyBytes = 30 << 20
)

var errChatBodyTooLarge = errors.New("会话内容过大：历史图片与附件展开后超过 30MB，请减少图片数量或新建会话后重试")

func validateChatForwardBodySize(size int) error {
	if size > maxChatForwardBodyBytes {
		return errChatBodyTooLarge
	}
	return nil
}

func (p *Plugin) RegisterRoutes(r sdk.RouteRegistrar) {
	// Conversation CRUD
	r.Handle(http.MethodPost, "/conversations", p.requireUser(p.handleCreateConversation))
	r.Handle(http.MethodGet, "/conversations", p.requireUser(p.handleListConversations))
	r.Handle(http.MethodGet, "/conversations/", p.requireUser(p.handleGetConversation))
	r.Handle(http.MethodPut, "/conversations/", p.requireUser(p.handleUpdateConversation))
	r.Handle(http.MethodDelete, "/conversations/", p.requireUser(p.handleDeleteConversation))

	// Messages
	r.Handle(http.MethodGet, "/messages/", p.requireUser(p.handleListMessages))
	r.Handle(http.MethodPut, "/messages/", p.requireUser(p.handleUpdateMessage))
	r.Handle(http.MethodPost, "/messages", p.requireUser(p.handlePersistMessage))
	r.Handle(http.MethodPost, "/chat/completions", p.requireUser(p.handleChatCompletions))

	// Metadata
	r.Handle(http.MethodGet, "/user/info", p.requireUser(p.handleGetUserInfo))
	r.Handle(http.MethodGet, "/models", p.requireUser(p.handleListModels))
}

// ── Middleware ──

func (p *Plugin) requireUser(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		entry := r.Header.Get(headerEntry)
		if entry != "user" && entry != "admin" {
			writeJSON(w, http.StatusForbidden, map[string]string{"error": "user entry required"})
			return
		}
		if r.Header.Get(headerUserID) == "" {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "missing user identity"})
			return
		}
		if !p.Configured() {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "plugin not configured"})
			return
		}
		next(w, r)
	}
}

// ── Conversation Handlers ──

func (p *Plugin) handleCreateConversation(w http.ResponseWriter, r *http.Request) {
	userID := parseUserID(r)
	var req struct {
		Title    string `json:"title"`
		GroupID  int64  `json:"group_id"`
		Platform string `json:"platform"`
		Model    string `json:"model"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	conv, err := p.svc.CreateConversation(r.Context(), userID, req.Title, req.GroupID, req.Platform, req.Model)
	if err != nil {
		var limitErr *conversationLimitError
		if errors.As(err, &limitErr) {
			writeJSON(w, http.StatusConflict, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, conv)
}

func (p *Plugin) handleListConversations(w http.ResponseWriter, r *http.Request) {
	convs, err := p.svc.ListConversations(r.Context(), parseUserID(r))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if convs == nil {
		convs = []Conversation{}
	}
	writeJSON(w, http.StatusOK, convs)
}

func (p *Plugin) handleGetConversation(w http.ResponseWriter, r *http.Request) {
	convID := parsePathID(r.URL.Path, "/conversations/")
	if convID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid conversation id"})
		return
	}
	conv, err := p.svc.GetConversation(r.Context(), parseUserID(r), convID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if conv == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "conversation not found"})
		return
	}
	writeJSON(w, http.StatusOK, conv)
}

func (p *Plugin) handleUpdateConversation(w http.ResponseWriter, r *http.Request) {
	convID := parsePathID(r.URL.Path, "/conversations/")
	if convID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid conversation id"})
		return
	}
	var req struct {
		Title    string `json:"title"`
		GroupID  int64  `json:"group_id"`
		Platform string `json:"platform"`
		Model    string `json:"model"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if err := p.svc.UpdateConversation(r.Context(), parseUserID(r), convID, req.Title, req.GroupID, req.Platform, req.Model); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (p *Plugin) handleDeleteConversation(w http.ResponseWriter, r *http.Request) {
	convID := parsePathID(r.URL.Path, "/conversations/")
	if convID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid conversation id"})
		return
	}
	if err := p.svc.DeleteConversation(r.Context(), parseUserID(r), convID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// ── Message Handler ──

func (p *Plugin) handleListMessages(w http.ResponseWriter, r *http.Request) {
	convID := parsePathID(r.URL.Path, "/messages/")
	if convID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid conversation id"})
		return
	}
	msgs, err := p.svc.ListMessages(r.Context(), parseUserID(r), convID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if msgs == nil {
		msgs = []Message{}
	}
	writeJSON(w, http.StatusOK, msgs)
}

func (p *Plugin) handlePersistMessage(w http.ResponseWriter, r *http.Request) {
	var req PersistMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if req.ConversationID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "conversation_id required"})
		return
	}
	if req.Role == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "role required"})
		return
	}

	msg, err := p.svc.PersistMessage(r.Context(), parseUserID(r), req)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, msg)
}

func (p *Plugin) handleUpdateMessage(w http.ResponseWriter, r *http.Request) {
	msgID := parsePathID(r.URL.Path, "/messages/")
	if msgID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid message id"})
		return
	}

	var req UpdateMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	msg, err := p.svc.UpdateMessage(r.Context(), parseUserID(r), msgID, req)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, msg)
}

func (p *Plugin) handleChatCompletions(w http.ResponseWriter, r *http.Request) {
	// 派生请求级 logger 写回 ctx
	rid := sdk.ExtractOrGenerateRequestID(r.Header)
	ctx := sdk.WithRequestID(r.Context(), rid)
	ctx, logger := sdk.LoggerWithRequestID(ctx)
	logger.Debug("playground_request_received",
		sdk.LogFieldMethod, r.Method,
		sdk.LogFieldPath, r.URL.Path,
		sdk.LogFieldUserID, parseUserID(r),
	)

	platform := strings.TrimSpace(r.Header.Get("X-Airgate-Platform"))
	if platform == "" {
		writeOpenAIError(w, http.StatusBadRequest, "invalid_request_error", "invalid_request", "platform required")
		return
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeOpenAIError(w, http.StatusBadRequest, "invalid_request_error", "invalid_request", "invalid request body")
		return
	}
	// 资产重写只会让 body 变大（asset 引用 → base64 data URL），原始超限的请求
	// 先拒掉，省去整份 JSON 解析、资产拉取与 base64 编码。
	if err := validateChatForwardBodySize(len(body)); err != nil {
		logger.Warn("chat_forward_body_too_large", "body_bytes", len(body), "stage", "raw")
		writeOpenAIError(w, http.StatusBadRequest, "invalid_request_error", "request_too_large", err.Error())
		return
	}
	body, err = p.rewriteChatImageAssetURLs(ctx, body)
	if err != nil {
		writeOpenAIError(w, http.StatusBadRequest, "invalid_request_error", "invalid_request", err.Error())
		return
	}
	if err := validateChatForwardBodySize(len(body)); err != nil {
		logger.Warn("chat_forward_body_too_large", "body_bytes", len(body), "stage", "expanded")
		writeOpenAIError(w, http.StatusBadRequest, "invalid_request_error", "request_too_large", err.Error())
		return
	}
	plan, err := compileChatForwardPlan(platform, body)
	if err != nil {
		writeOpenAIError(w, http.StatusBadRequest, "invalid_request_error", "invalid_request", err.Error())
		return
	}
	var fields struct {
		Stream *bool `json:"stream"`
	}
	_ = json.Unmarshal(body, &fields)
	stream := fields.Stream == nil || *fields.Stream

	headers := make(http.Header)
	headers.Set("Content-Type", "application/json")
	headers.Set("X-Airgate-Platform", plan.Platform)
	logger.Debug("upstream_request_start",
		sdk.LogFieldPlatform, plan.Platform,
		sdk.LogFieldModel, plan.Model,
		sdk.LogFieldPath, plan.Path,
		"stream", stream,
	)
	if !stream {
		headers.Set("Accept", "application/json")
		resp, err := hostForward(ctx, p.host, hostForwardRequest{
			UserID:  int64(parseUserID(r)),
			GroupID: 0,
			Model:   plan.Model,
			Method:  http.MethodPost,
			Path:    plan.Path,
			Headers: headers,
			Body:    plan.Body,
			Stream:  false,
		})
		if err != nil {
			logger.Warn("upstream_request_failed",
				sdk.LogFieldPlatform, plan.Platform,
				sdk.LogFieldModel, plan.Model,
				sdk.LogFieldError, err,
			)
			writeHostForwardError(w, err)
			return
		}
		logger.Debug("upstream_request_completed",
			sdk.LogFieldPlatform, plan.Platform,
			sdk.LogFieldModel, plan.Model,
			sdk.LogFieldStatus, resp.StatusCode,
		)
		copyHeaders(w.Header(), resp.Headers)
		if w.Header().Get("Content-Type") == "" {
			w.Header().Set("Content-Type", "application/json")
		}
		status := resp.StatusCode
		if status == 0 {
			status = http.StatusOK
		}
		w.WriteHeader(status)
		respBody := resp.Body
		if plan.NormalizeJSON && status >= 200 && status < 300 {
			if normalized, err := normalizeClaudeMessageResponse(respBody); err == nil {
				respBody = normalized
			}
		}
		_, _ = w.Write(respBody)
		return
	}
	headers.Set("Accept", "text/event-stream")

	committed := false
	var finalUsage *sdk.Usage
	var bridge *claudeSSEBridge
	if plan.NormalizeSSE {
		bridge = &claudeSSEBridge{w: w, model: plan.ResponseModel}
	}
	err = hostForwardStream(ctx, p.host, hostForwardRequest{
		UserID:  int64(parseUserID(r)),
		GroupID: 0,
		Model:   plan.Model,
		Method:  http.MethodPost,
		Path:    plan.Path,
		Headers: headers,
		Body:    plan.Body,
		Stream:  true,
	}, func(chunk hostForwardChunk) error {
		if chunk.Done {
			finalUsage = chunk.Usage
			if bridge != nil {
				return bridge.Flush()
			}
			return nil
		}
		if !committed {
			copyStreamingHeaders(w.Header(), chunk.Headers, plan.NormalizeSSE)
			if w.Header().Get("Content-Type") == "" {
				w.Header().Set("Content-Type", "text/event-stream")
			}
			status := chunk.StatusCode
			if status == 0 {
				status = http.StatusOK
			}
			w.WriteHeader(status)
			committed = true
		}
		if len(chunk.Data) > 0 {
			if bridge != nil {
				if _, err := bridge.Write(chunk.Data); err != nil {
					return err
				}
			} else {
				if _, err := w.Write(chunk.Data); err != nil {
					return err
				}
			}
		}
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
		}
		return nil
	})
	if err != nil {
		logger.Warn("upstream_request_failed",
			sdk.LogFieldPlatform, plan.Platform,
			sdk.LogFieldModel, plan.Model,
			"stream", true,
			sdk.LogFieldError, err,
		)
		if !committed {
			writeHostForwardError(w, err)
			return
		}
		_, _ = w.Write([]byte("data: {\"error\":{\"message\":\"请求暂时无法完成，请稍后重试\",\"type\":\"server_error\",\"code\":\"upstream_error\"}}\n\n"))
		return
	}
	logger.Debug("upstream_request_completed",
		sdk.LogFieldPlatform, plan.Platform,
		sdk.LogFieldModel, plan.Model,
		"stream", true,
	)
	if finalUsage != nil {
		if plan.NormalizeSSE {
			_ = writeOpenAIUsage(w, finalUsage, finalUsage.Model)
		} else {
			payload, _ := json.Marshal(map[string]any{"usage": finalUsage})
			_, _ = w.Write([]byte("data: "))
			_, _ = w.Write(payload)
			_, _ = w.Write([]byte("\n\n"))
		}
	}
}

// ── Metadata Handlers ──

func (p *Plugin) handleGetUserInfo(w http.ResponseWriter, r *http.Request) {
	info, err := hostGetUserInfo(r.Context(), p.host, int64(parseUserID(r)))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, info)
}

// chatModelPlatforms AI Chat 支持的平台，顺序即前端下拉的分组顺序。
// 模型清单来自各网关插件的注册表（claude＝Max 号池网关声明的模型；
// 转发始终走用户 API Key 所属分组，不会因选择模型改路由到别的分组）。
var chatModelPlatforms = []string{"claude", "openai"}

func (p *Plugin) handleListModels(w http.ResponseWriter, r *http.Request) {
	models := make([]hostModelInfo, 0, 16)
	for _, platform := range chatModelPlatforms {
		items, err := hostListModels(r.Context(), p.host, platform)
		if err != nil {
			// 单平台失败不阻断（如插件未装）；前端拿到空列表时回退硬编码
			continue
		}
		models = append(models, items...)
	}
	writeJSON(w, http.StatusOK, map[string]any{"models": models})
}

// ── Helpers ──

func parseUserID(r *http.Request) int {
	id, _ := strconv.Atoi(r.Header.Get(headerUserID))
	return id
}

func parsePathID(path, prefix string) int64 {
	idx := strings.LastIndex(path, prefix)
	if idx < 0 {
		return 0
	}
	seg := strings.TrimRight(path[idx+len(prefix):], "/")
	id, _ := strconv.ParseInt(seg, 10, 64)
	return id
}

func (p *Plugin) rewriteChatImageAssetURLs(ctx context.Context, body []byte) ([]byte, error) {
	if p.svc == nil || p.svc.storage == nil || !bytes.Contains(body, []byte(`"image_url"`)) || !bytes.Contains(body, []byte("/assets-runtime/")) {
		return body, nil
	}
	var payload any
	if err := json.Unmarshal(body, &payload); err != nil {
		return body, nil
	}
	changed := false
	converted, err := p.rewriteImageURLValue(ctx, payload, &changed)
	if err != nil {
		return nil, err
	}
	if !changed {
		return body, nil
	}
	return json.Marshal(converted)
}

func (p *Plugin) rewriteImageURLValue(ctx context.Context, value any, changed *bool) (any, error) {
	switch v := value.(type) {
	case map[string]any:
		if raw, ok := v["url"].(string); ok && strings.HasPrefix(raw, "/assets-runtime/") {
			dataURL, err := p.assetRuntimeURLToDataURL(ctx, raw)
			if err != nil {
				return nil, err
			}
			v["url"] = dataURL
			*changed = true
		}
		for key, item := range v {
			converted, err := p.rewriteImageURLValue(ctx, item, changed)
			if err != nil {
				return nil, err
			}
			v[key] = converted
		}
		return v, nil
	case []any:
		for i, item := range v {
			converted, err := p.rewriteImageURLValue(ctx, item, changed)
			if err != nil {
				return nil, err
			}
			v[i] = converted
		}
		return v, nil
	default:
		return value, nil
	}
}

func (p *Plugin) assetRuntimeURLToDataURL(ctx context.Context, raw string) (string, error) {
	objectKey, err := assetObjectKeyFromRuntimeURL(raw)
	if err != nil {
		return "", err
	}
	asset, err := p.svc.storage.GetBytes(ctx, objectKey)
	if err != nil {
		return "", err
	}
	contentType := strings.TrimSpace(asset.ContentType)
	if contentType == "" || contentType == "application/octet-stream" {
		contentType = imageContentTypeForObjectKey(objectKey)
	}
	return "data:" + contentType + ";base64," + base64.StdEncoding.EncodeToString(asset.Data), nil
}

func assetObjectKeyFromRuntimeURL(raw string) (string, error) {
	u, err := url.Parse(raw)
	if err != nil {
		return "", err
	}
	pathValue := u.Path
	if pathValue == "" && strings.HasPrefix(raw, "/assets-runtime/") {
		pathValue = raw
	}
	const prefix = "/assets-runtime/"
	if !strings.HasPrefix(pathValue, prefix) {
		return "", fmt.Errorf("invalid asset url")
	}
	objectKey, err := url.PathUnescape(strings.TrimPrefix(pathValue, prefix))
	if err != nil {
		return "", err
	}
	objectKey = strings.TrimLeft(objectKey, "/")
	if objectKey == "" {
		return "", fmt.Errorf("invalid asset url")
	}
	return objectKey, nil
}

func imageContentTypeForObjectKey(objectKey string) string {
	switch {
	case strings.HasSuffix(strings.ToLower(objectKey), ".jpg"), strings.HasSuffix(strings.ToLower(objectKey), ".jpeg"):
		return "image/jpeg"
	case strings.HasSuffix(strings.ToLower(objectKey), ".png"):
		return "image/png"
	case strings.HasSuffix(strings.ToLower(objectKey), ".webp"):
		return "image/webp"
	case strings.HasSuffix(strings.ToLower(objectKey), ".gif"):
		return "image/gif"
	default:
		return "image/png"
	}
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
}

func writeOpenAIError(w http.ResponseWriter, status int, errType, code, message string) {
	writeJSON(w, status, map[string]any{
		"error": map[string]string{
			"message": message,
			"type":    errType,
			"code":    code,
		},
	})
}

func writeHostForwardError(w http.ResponseWriter, err error) {
	s, ok := status.FromError(err)
	if !ok {
		writeOpenAIError(w, http.StatusServiceUnavailable, "server_error", "upstream_error", "请求暂时无法完成，请稍后重试")
		return
	}
	switch s.Code() {
	case codes.InvalidArgument:
		msg := s.Message()
		if msg == "" {
			msg = "请求无法完成，请检查输入后重试"
		}
		writeOpenAIError(w, http.StatusBadRequest, "invalid_request_error", "invalid_request", msg)
	case codes.ResourceExhausted:
		writeOpenAIError(w, http.StatusPaymentRequired, "insufficient_quota", "insufficient_quota", "余额不足")
	default:
		writeOpenAIError(w, http.StatusServiceUnavailable, "server_error", "upstream_error", "请求暂时无法完成，请稍后重试")
	}
}

func copyHeaders(dst, src http.Header) {
	for k, vals := range src {
		for _, v := range vals {
			dst.Add(k, v)
		}
	}
}
