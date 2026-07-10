package playground

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	"image/png"
	"io"
	"testing"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

func TestHostForwardStreamParsesDoneUsage(t *testing.T) {
	t.Parallel()

	host := &streamingHost{
		stream: &sliceHostStream{
			frames: []sdk.HostStreamFrame{
				{
					Payload: map[string]interface{}{
						"data": "data: {\"choices\":[{\"delta\":{\"content\":\"hi\"}}]}\n\n",
					},
				},
				{
					Done: true,
					Payload: map[string]interface{}{
						"usage": map[string]interface{}{
							"model":        "claude-opus-4-8",
							"account_cost": 0.001,
							"metrics": []interface{}{
								map[string]interface{}{"key": "input_tokens", "value": 10},
								map[string]interface{}{"key": "output_tokens", "value": 4},
							},
						},
					},
				},
			},
		},
	}

	var doneUsage *sdk.Usage
	err := hostForwardStream(context.Background(), host, hostForwardRequest{}, func(chunk hostForwardChunk) error {
		if chunk.Done {
			doneUsage = chunk.Usage
		}
		return nil
	})
	if err != nil {
		t.Fatalf("hostForwardStream() error = %v", err)
	}
	if doneUsage == nil {
		t.Fatal("done usage is nil")
	}
	if doneUsage.Model != "claude-opus-4-8" {
		t.Fatalf("usage model = %q", doneUsage.Model)
	}
	if len(doneUsage.Metrics) != 2 {
		t.Fatalf("usage metrics = %+v, want two metrics", doneUsage.Metrics)
	}
}

// testPNGBytes 生成一张真实可解码的 PNG（含 \x89PNG 魔数），用于二进制载荷往返断言。
func testPNGBytes(t *testing.T) []byte {
	t.Helper()
	var buf bytes.Buffer
	img := image.NewRGBA(image.Rect(0, 0, 2, 2))
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("encode png: %v", err)
	}
	return buf.Bytes()
}

// assetBytesHost 复刻 assets.get_bytes 的真实线上编组：core 把 []byte 放进 payload，
// 经 pluginHostHandle 的 json.Marshal 后到达插件侧时 data 必然是 base64 字符串。
// 直接手填 map（跳过 JSON 往返）会掩盖双重 base64 编码 bug——历史上正因如此漏测。
type assetBytesHost struct {
	data        []byte
	contentType string
	gotObjectKey string
}

func (h *assetBytesHost) Invoke(_ context.Context, req sdk.HostInvokeRequest) (*sdk.HostInvokeResponse, error) {
	if req.Method != hostMethodAssetsGetBytes {
		return nil, fmt.Errorf("unexpected method %s", req.Method)
	}
	h.gotObjectKey, _ = req.Payload["object_key"].(string)
	encoded, err := json.Marshal(map[string]interface{}{
		"data":         h.data,
		"content_type": h.contentType,
	})
	if err != nil {
		return nil, err
	}
	var payload map[string]interface{}
	if err := json.Unmarshal(encoded, &payload); err != nil {
		return nil, err
	}
	return &sdk.HostInvokeResponse{Status: "ok", Payload: payload}, nil
}

func (h *assetBytesHost) InvokeStream(context.Context, sdk.HostStreamRequest) (sdk.HostStream, error) {
	return nil, fmt.Errorf("stream not supported in assetBytesHost")
}

// 回归：hostGetAssetBytes 必须还原出与 core 侧写入完全一致的原始字节。
// 修复前 bytesFromPayload 的 looksLikeJSON 门槛会把图片的 base64 文本当字节返回，
// 后续再编码一次形成双重 base64，上游以 "Could not process image" 拒绝。
func TestHostGetAssetBytesDecodesJSONWirePayload(t *testing.T) {
	t.Parallel()

	original := testPNGBytes(t)
	host := &assetBytesHost{data: original, contentType: "image/png"}

	got, err := hostGetAssetBytes(context.Background(), host, "chat/1/202607/demo.png")
	if err != nil {
		t.Fatalf("hostGetAssetBytes() error = %v", err)
	}
	if host.gotObjectKey != "chat/1/202607/demo.png" {
		t.Fatalf("object_key = %q", host.gotObjectKey)
	}
	if got.ContentType != "image/png" {
		t.Fatalf("content type = %q", got.ContentType)
	}
	if !bytes.Equal(got.Data, original) {
		t.Fatalf("data 与原始字节不一致：len=%d want %d，前 8 字节 %x（若为 base64 文本说明发生双重编码）",
			len(got.Data), len(original), got.Data[:min(8, len(got.Data))])
	}
	if sniffed := sniffImageMediaType(base64.StdEncoding.EncodeToString(got.Data)); sniffed != "image/png" {
		t.Fatalf("解码后字节魔数嗅探 = %q, want image/png", sniffed)
	}
}

func TestBinaryFromPayload(t *testing.T) {
	t.Parallel()

	raw := []byte{0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01}
	cases := []struct {
		name  string
		value interface{}
		want  []byte
	}{
		{"nil 返回空", nil, nil},
		{"原生 []byte 直通", raw, raw},
		{"base64 字符串必须解码（不做 JSON 嗅探）", base64.StdEncoding.EncodeToString(raw), raw},
		{"非 base64 字符串按原文返回", "not-base64!!", []byte("not-base64!!")},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := binaryFromPayload(tc.value); !bytes.Equal(got, tc.want) {
				t.Fatalf("binaryFromPayload() = %x, want %x", got, tc.want)
			}
		})
	}
}

// bytesFromPayload 是 gateway.forward 专用的启发式（SSE 明文串必须原样透传、
// base64 的 JSON 响应体要解码），与 binaryFromPayload 行为差异是有意的，锁住防误改。
func TestBytesFromPayloadKeepsForwardHeuristic(t *testing.T) {
	t.Parallel()

	sse := "data: {\"choices\":[]}\n\n"
	if got := bytesFromPayload(sse); string(got) != sse {
		t.Fatalf("SSE 明文被改写: %q", got)
	}
	jsonBody := []byte(`{"ok":true}`)
	if got := bytesFromPayload(base64.StdEncoding.EncodeToString(jsonBody)); !bytes.Equal(got, jsonBody) {
		t.Fatalf("base64 JSON 未解码: %q", got)
	}
}

type streamingHost struct {
	stream sdk.HostStream
}

func (h *streamingHost) Invoke(context.Context, sdk.HostInvokeRequest) (*sdk.HostInvokeResponse, error) {
	return nil, nil
}

func (h *streamingHost) InvokeStream(context.Context, sdk.HostStreamRequest) (sdk.HostStream, error) {
	return h.stream, nil
}

type sliceHostStream struct {
	frames []sdk.HostStreamFrame
	next   int
}

func (s *sliceHostStream) Send(sdk.HostStreamFrame) error {
	return nil
}

func (s *sliceHostStream) Recv() (*sdk.HostStreamFrame, error) {
	if s.next >= len(s.frames) {
		return nil, io.EOF
	}
	frame := s.frames[s.next]
	s.next++
	return &frame, nil
}

func (s *sliceHostStream) CloseSend() error {
	return nil
}
