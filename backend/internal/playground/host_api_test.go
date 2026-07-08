package playground

import (
	"context"
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
