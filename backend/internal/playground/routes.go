package playground

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	sdk "github.com/DouDOU-start/airgate-sdk"
)

const (
	headerEntry  = "X-Airgate-Entry"
	headerUserID = "X-Airgate-User-Id"
)

func (p *Plugin) RegisterRoutes(r sdk.RouteRegistrar) {
	// Conversation CRUD
	r.Handle(http.MethodPost, "/conversations", p.requireUser(p.handleCreateConversation))
	r.Handle(http.MethodGet, "/conversations", p.requireUser(p.handleListConversations))
	r.Handle(http.MethodGet, "/conversations/", p.requireUser(p.handleGetConversation))
	r.Handle(http.MethodPut, "/conversations/", p.requireUser(p.handleUpdateConversation))
	r.Handle(http.MethodDelete, "/conversations/", p.requireUser(p.handleDeleteConversation))

	// Messages
	r.Handle(http.MethodGet, "/messages/", p.requireUser(p.handleListMessages))
	r.Handle(http.MethodPost, "/messages", p.requireUser(p.handlePersistMessage))

	// Metadata (platforms, models, user info)
	r.Handle(http.MethodGet, "/platforms", p.requireUser(p.handleListPlatforms))
	r.Handle(http.MethodGet, "/models", p.requireUser(p.handleListModels))
	r.Handle(http.MethodGet, "/user/info", p.requireUser(p.handleGetUserInfo))
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

// ── Metadata Handlers ──

func (p *Plugin) handleListPlatforms(w http.ResponseWriter, r *http.Request) {
	platforms, err := p.host.ListPlatforms(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, platforms)
}

func (p *Plugin) handleListModels(w http.ResponseWriter, r *http.Request) {
	platform := r.URL.Query().Get("platform")
	if platform == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "platform query param required"})
		return
	}
	models, err := p.host.ListModels(r.Context(), platform)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, models)
}

func (p *Plugin) handleGetUserInfo(w http.ResponseWriter, r *http.Request) {
	info, err := p.host.GetUserInfo(r.Context(), int64(parseUserID(r)))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, info)
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

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}
}
