package playground

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
	"strings"
	"testing"
	"time"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

func TestResolveMaxConversationsPerUser(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name string
		cfg  sdk.PluginConfig
		want int
	}{
		{name: "空配置对象", cfg: nil, want: 10},
		{name: "空配置值", cfg: testPluginConfig{}, want: 10},
		{name: "非法配置值", cfg: testPluginConfig{"max_conversations_per_user": "abc"}, want: 10},
		{name: "负数配置值", cfg: testPluginConfig{"max_conversations_per_user": "-1"}, want: 10},
		{name: "不限制配置值", cfg: testPluginConfig{"max_conversations_per_user": "0"}, want: 0},
		{name: "自定义配置值", cfg: testPluginConfig{"max_conversations_per_user": "42"}, want: 42},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			if got := resolveMaxConversationsPerUser(tc.cfg); got != tc.want {
				t.Fatalf("会话上限 = %d，期望 %d", got, tc.want)
			}
		})
	}
}

func TestClampRenderFee(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name             string
		total, renderFee float64
		want             float64
	}{
		{name: "valid split", total: 0.28, renderFee: 0.03, want: 0.03},
		{name: "free render", total: 0.25, renderFee: 0, want: 0},
		{name: "negative render", total: 0.25, renderFee: -1, want: 0},
		{name: "render exceeds total", total: 0.02, renderFee: 0.03, want: 0.02},
		{name: "negative total", total: -1, renderFee: 0.03, want: 0},
		{name: "nan", total: 1, renderFee: math.NaN(), want: 0},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if got := clampRenderFee(tc.total, tc.renderFee); got != tc.want {
				t.Fatalf("clampRenderFee(%v, %v) = %v, want %v", tc.total, tc.renderFee, got, tc.want)
			}
		})
	}
}

func TestDeleteAssetsFromStorageInvokesHostDelete(t *testing.T) {
	t.Parallel()

	host := &recordingHost{}
	service := &Service{
		logger:  slog.Default(),
		storage: &ObjectStorage{host: host},
	}

	err := service.deleteAssetsFromStorage(context.Background(), []Asset{
		{ID: "asset-1", ObjectKey: "chat/42/202605/image.png"},
	})
	if err != nil {
		t.Fatalf("删除资产失败: %v", err)
	}
	if len(host.deleted) != 1 || host.deleted[0] != "chat/42/202605/image.png" {
		t.Fatalf("删除对象 = %#v，期望删除 chat/42/202605/image.png", host.deleted)
	}
}

func TestRefreshToolCallAssetURLs(t *testing.T) {
	t.Parallel()
	raw := json.RawMessage(`[{"id":"call-1","result":{"file":{"name":"report.pdf","src":"https://old.example/expired","asset_uri":"airgate-asset://asset/abc123"}}}]`)

	resolved, err := refreshToolCallAssetURLs(raw, func(assetURI string) (string, error) {
		if assetURI != "airgate-asset://asset/abc123" {
			t.Fatalf("asset URI = %q", assetURI)
		}
		return "https://new.example/signed", nil
	})
	if err != nil {
		t.Fatalf("refresh tool call asset URL: %v", err)
	}

	var calls []struct {
		Result struct {
			File struct {
				Src      string `json:"src"`
				AssetURI string `json:"asset_uri"`
			} `json:"file"`
		} `json:"result"`
	}
	if err := json.Unmarshal(resolved, &calls); err != nil {
		t.Fatalf("decode resolved tool calls: %v", err)
	}
	if len(calls) != 1 || calls[0].Result.File.Src != "https://new.example/signed" {
		t.Fatalf("resolved calls = %s", resolved)
	}
	if calls[0].Result.File.AssetURI != "airgate-asset://asset/abc123" {
		t.Fatalf("stable asset URI was changed: %s", resolved)
	}
}

func TestRefreshToolCallAssetURLsKeepsOriginalOnResolveError(t *testing.T) {
	t.Parallel()
	raw := json.RawMessage(`[{"result":{"file":{"src":"https://old.example/expired","asset_uri":"airgate-asset://asset/missing"}}}]`)
	resolved, err := refreshToolCallAssetURLs(raw, func(string) (string, error) {
		return "", fmt.Errorf("asset not found")
	})
	if err == nil {
		t.Fatal("expected resolver error")
	}
	if !strings.Contains(string(resolved), "https://old.example/expired") {
		t.Fatalf("old URL should remain on error: %s", resolved)
	}
}

type testPluginConfig map[string]string

func (c testPluginConfig) GetString(key string) string {
	return c[key]
}

func (c testPluginConfig) GetInt(key string) int {
	return 0
}

func (c testPluginConfig) GetBool(key string) bool {
	return false
}

func (c testPluginConfig) GetFloat64(key string) float64 {
	return 0
}

func (c testPluginConfig) GetDuration(key string) time.Duration {
	return 0
}

func (c testPluginConfig) GetAll() map[string]string {
	out := make(map[string]string, len(c))
	for key, value := range c {
		out[key] = value
	}
	return out
}

type recordingHost struct {
	deleted []string
}

func (h *recordingHost) Invoke(_ context.Context, req sdk.HostInvokeRequest) (*sdk.HostInvokeResponse, error) {
	if req.Method != hostMethodAssetsDelete {
		return nil, fmt.Errorf("非预期方法: %s", req.Method)
	}
	objectKey, _ := req.Payload["object_key"].(string)
	h.deleted = append(h.deleted, objectKey)
	return &sdk.HostInvokeResponse{
		Status:  "ok",
		Payload: map[string]interface{}{"deleted": true},
	}, nil
}

func (h *recordingHost) InvokeStream(context.Context, sdk.HostStreamRequest) (sdk.HostStream, error) {
	return nil, fmt.Errorf("未实现")
}
