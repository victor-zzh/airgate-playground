package playground

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestOfficeRendererHealthAndRender(t *testing.T) {
	t.Parallel()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/health":
			w.WriteHeader(http.StatusOK)
		case "/render/docx":
			w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
			_, _ = w.Write([]byte("PK\x03\x04docx"))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()
	renderer := newOfficeRenderer(server.URL)
	if !renderer.Healthy(context.Background()) {
		t.Fatal("renderer should be healthy")
	}
	data, err := renderer.RenderDOCX(context.Background(), "title", "content")
	if err != nil {
		t.Fatal(err)
	}
	if string(data[:2]) != "PK" {
		t.Fatalf("signature = %q", data[:2])
	}
}

func TestOfficeRendererRejectsInvalidSignature(t *testing.T) {
	t.Parallel()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("not-an-office-file"))
	}))
	defer server.Close()
	if _, err := newOfficeRenderer(server.URL).RenderDOCX(context.Background(), "title", "content"); err == nil {
		t.Fatal("expected invalid signature error")
	}
}
