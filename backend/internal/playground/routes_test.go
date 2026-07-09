package playground

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestValidateChatForwardBodySize(t *testing.T) {
	t.Parallel()

	if err := validateChatForwardBodySize(maxChatForwardBodyBytes); err != nil {
		t.Fatalf("body at limit should pass, got %v", err)
	}
	err := validateChatForwardBodySize(maxChatForwardBodyBytes + 1)
	if err == nil {
		t.Fatal("body above limit should be rejected")
	}
	if !strings.Contains(err.Error(), "30MB") {
		t.Fatalf("error = %q, want actionable size hint", err.Error())
	}
}

func TestWriteHostForwardErrorInvalidArgument(t *testing.T) {
	t.Parallel()

	recorder := httptest.NewRecorder()

	writeHostForwardError(recorder, status.Error(codes.InvalidArgument, "图片过大，请压缩后重试"))

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	if body := recorder.Body.String(); !strings.Contains(body, "图片过大，请压缩后重试") {
		t.Fatalf("body = %q, want contain image too large message", body)
	}
	if body := recorder.Body.String(); !strings.Contains(body, "invalid_request_error") {
		t.Fatalf("body = %q, want invalid_request_error", body)
	}
}

func TestWriteHostForwardErrorUnavailable(t *testing.T) {
	t.Parallel()

	recorder := httptest.NewRecorder()

	writeHostForwardError(recorder, status.Error(codes.Unavailable, "upstream exploded"))

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusServiceUnavailable)
	}
	body := recorder.Body.String()
	if strings.Contains(body, "upstream exploded") {
		t.Fatalf("body = %q, want sanitized upstream error", body)
	}
	if !strings.Contains(body, "请求暂时无法完成，请稍后重试") {
		t.Fatalf("body = %q, want generic retry message", body)
	}
}
