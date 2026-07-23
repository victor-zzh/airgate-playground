package playground

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

var directExportDriverID int64

type directExportTestDriver struct{}

func (directExportTestDriver) Open(string) (driver.Conn, error) { return &directExportTestConn{}, nil }

type directExportTestConn struct{}

func (*directExportTestConn) Prepare(string) (driver.Stmt, error) { return nil, driver.ErrSkip }
func (*directExportTestConn) Close() error                        { return nil }
func (*directExportTestConn) Begin() (driver.Tx, error)           { return nil, driver.ErrSkip }
func (*directExportTestConn) ExecContext(context.Context, string, []driver.NamedValue) (driver.Result, error) {
	return driver.RowsAffected(1), nil
}
func (*directExportTestConn) QueryContext(_ context.Context, query string, _ []driver.NamedValue) (driver.Rows, error) {
	if strings.Contains(query, "FROM playground_conversations") {
		now := time.Date(2026, 7, 23, 0, 0, 0, 0, time.UTC)
		values := []driver.Value{int64(7), int64(9), "季度报告", int64(0), "claude", "claude-sonnet-5", now, now}
		columns := make([]string, len(values))
		return &directExportTestRows{columns: columns, values: values}, nil
	}
	if !strings.Contains(query, "FROM playground_messages m") {
		return nil, fmt.Errorf("unexpected query: %s", query)
	}
	now := time.Date(2026, 7, 23, 0, 0, 0, 0, time.UTC)
	values := []driver.Value{
		int64(42), int64(7), "assistant", "# 季度报告\n\n| 项目 | 金额 |\n| --- | ---: |\n| 研发 | 120 |", "", "",
		"claude", "claude-sonnet-5", int64(0), int64(100), int64(20), float64(0.01), float64(0), "stop", []byte("[]"), now,
		int64(7), int64(9), "季度报告", int64(0), "claude", "claude-sonnet-5", now, now,
	}
	columns := make([]string, len(values))
	for i := range columns {
		columns[i] = fmt.Sprintf("c%d", i)
	}
	return &directExportTestRows{columns: columns, values: values}, nil
}

type directExportTestRows struct {
	columns []string
	values  []driver.Value
	done    bool
}

func (r *directExportTestRows) Columns() []string { return r.columns }
func (*directExportTestRows) Close() error        { return nil }
func (r *directExportTestRows) Next(dest []driver.Value) error {
	if r.done {
		return io.EOF
	}
	copy(dest, r.values)
	r.done = true
	return nil
}

type directExportTestHost struct {
	assetStores     int
	usageRecords    int
	gatewayForwards int
	usageRequest    sdk.HostInvokeRequest
	streamFrames    []sdk.HostStreamFrame
	storedData      []byte
	storedType      string
}

func (h *directExportTestHost) Invoke(_ context.Context, req sdk.HostInvokeRequest) (*sdk.HostInvokeResponse, error) {
	switch req.Method {
	case hostMethodAssetsStore:
		h.assetStores++
		data, _ := req.Payload["data"].([]byte)
		contentType, _ := req.Payload["content_type"].(string)
		h.storedData = append([]byte(nil), data...)
		h.storedType = contentType
		return &sdk.HostInvokeResponse{Status: "ok", Payload: map[string]interface{}{
			"asset_id": "asset-export", "object_key": "chat/9/asset-export.xlsx",
			"public_url": "https://files.example/asset-export.xlsx", "content_type": contentType,
			"size_bytes": int64(len(data)),
		}}, nil
	case hostMethodUsageRecord:
		h.usageRecords++
		h.usageRequest = req
		format, _ := req.Payload["format"].(string)
		return &sdk.HostInvokeResponse{Status: "ok", Payload: map[string]interface{}{
			"usage": map[string]interface{}{
				"model": "document-render-" + format, "user_cost": 0.03,
				"metrics":      []interface{}{map[string]interface{}{"key": "document_render", "kind": "custom", "value": 1}},
				"cost_details": []interface{}{map[string]interface{}{"key": "document_render", "user_cost": 0.03}},
			},
		}}, nil
	case hostMethodGatewayForward:
		h.gatewayForwards++
		return nil, fmt.Errorf("gateway.forward must not be called")
	default:
		return nil, fmt.Errorf("unexpected host method %s", req.Method)
	}
}

func (h *directExportTestHost) InvokeStream(_ context.Context, req sdk.HostStreamRequest) (sdk.HostStream, error) {
	h.gatewayForwards++
	if req.Method != hostMethodGatewayForward || len(h.streamFrames) == 0 {
		return nil, fmt.Errorf("unexpected stream method %s", req.Method)
	}
	return &fakeHostStream{frames: h.streamFrames}, nil
}

func TestMarkdownToSpreadsheetPreservesGFMTable(t *testing.T) {
	input, err := markdownToSpreadsheet("销售汇总", "# 销售汇总\n\n| 月份 | 金额 |\n| --- | ---: |\n| 一月 | 120 |\n| 二月 | 180 |\n")
	if err != nil {
		t.Fatalf("markdownToSpreadsheet: %v", err)
	}
	if len(input.Sheets) != 1 || len(input.Sheets[0].Columns) != 2 || len(input.Sheets[0].Rows) != 2 {
		t.Fatalf("table shape = %+v", input)
	}
	if input.Sheets[0].Rows[1][1] != "180" {
		t.Fatalf("table value = %#v, want 180", input.Sheets[0].Rows[1][1])
	}
}

func TestMarkdownToPresentationSplitsLongTextWithoutDroppingContent(t *testing.T) {
	content := "# 背景\n\n这是一段需要拆分的内容。" + string(make([]rune, 0))
	for len([]rune(content)) < 300 {
		content += "补充说明，"
	}
	input, err := markdownToPresentation("演示", content)
	if err != nil {
		t.Fatalf("markdownToPresentation: %v", err)
	}
	if len(input.Slides) < 2 {
		t.Fatalf("slides = %+v, want title + content", input.Slides)
	}
	joined := ""
	for _, slide := range input.Slides {
		for _, bullet := range slide.Bullets {
			joined += bullet
		}
	}
	if len([]rune(joined)) < 250 {
		t.Fatalf("split text was dropped: %d runes", len([]rune(joined)))
	}
}

func TestMarkdownToPresentationKeepsTableAsTableSlide(t *testing.T) {
	input, err := markdownToPresentation("数据演示", "## 区域数据\n\n| 区域 | 数量 |\n| --- | ---: |\n| 北部 | 12 |\n")
	if err != nil {
		t.Fatalf("markdownToPresentation: %v", err)
	}
	if len(input.Slides) != 2 || input.Slides[1].Kind != "table" || input.Slides[1].Table == nil {
		t.Fatalf("slides = %+v, want title + table", input.Slides)
	}
}

func TestMarkdownToPresentationPreservesQuotesNestedListsAndLongHeadings(t *testing.T) {
	longHeading := strings.Repeat("长标题", 40)
	content := "## " + longHeading + "\n\n> 引用中的关键结论\n\n- 一级要点\n  - 二级要点\n"
	input, err := markdownToPresentation("完整内容", content)
	if err != nil {
		t.Fatalf("markdownToPresentation: %v", err)
	}
	var combined strings.Builder
	for _, slide := range input.Slides {
		combined.WriteString(slide.Title)
		combined.WriteString("\n")
		combined.WriteString(strings.Join(slide.Bullets, "\n"))
		combined.WriteString("\n")
	}
	got := combined.String()
	if !strings.Contains(strings.ReplaceAll(got, "\n", ""), longHeading) {
		t.Fatalf("presentation content lost long heading:\n%s", got)
	}
	for _, want := range []string{"引用中的关键结论", "一级要点", "二级要点"} {
		if !strings.Contains(got, want) {
			t.Fatalf("presentation content lost %q:\n%s", want, got)
		}
	}
	for index, slide := range input.Slides {
		if len([]rune(slide.Title)) > 100 {
			t.Fatalf("slide %d title exceeds renderer limit: %d", index+1, len([]rune(slide.Title)))
		}
	}
}

func TestMarkdownToPresentationSplitsLargeTablesWithoutDroppingRows(t *testing.T) {
	var content strings.Builder
	content.WriteString("## 明细\n\n| 序号 | 内容 |\n| ---: | --- |\n")
	for index := 1; index <= 35; index++ {
		fmt.Fprintf(&content, "| %d | ROW-%02d |\n", index, index)
	}
	input, err := markdownToPresentation("明细报告", content.String())
	if err != nil {
		t.Fatalf("markdownToPresentation: %v", err)
	}
	var rows []string
	for _, slide := range input.Slides {
		if slide.Table != nil {
			for _, row := range slide.Table.Rows {
				rows = append(rows, strings.Join(row, "|"))
			}
		}
	}
	if len(rows) != 35 || !strings.Contains(rows[0], "ROW-01") || !strings.Contains(rows[len(rows)-1], "ROW-35") {
		t.Fatalf("table rows lost: count=%d first=%q last=%q", len(rows), rows[0], rows[len(rows)-1])
	}
}

func TestMarkdownToSpreadsheetPreservesNonTableBlocks(t *testing.T) {
	input, err := markdownToSpreadsheet("说明", "# 总结\n\n> 关键引用\n\n- 第一项\n\n```text\nCODE-END\n```\n")
	if err != nil {
		t.Fatalf("markdownToSpreadsheet: %v", err)
	}
	var values []string
	for _, row := range input.Sheets[0].Rows {
		if len(row) > 0 {
			values = append(values, fmt.Sprint(row[0]))
		}
	}
	joined := strings.Join(values, "\n")
	for _, want := range []string{"总结", "关键引用", "第一项", "CODE-END"} {
		if !strings.Contains(joined, want) {
			t.Fatalf("spreadsheet content lost %q: %s", want, joined)
		}
	}
}

func TestMarkdownToSpreadsheetInfersSafeColumnTypes(t *testing.T) {
	input, err := markdownToSpreadsheet("数据", "| 项目 | 数量 | 金额 | 日期 | 编号 | 电话 |\n| --- | ---: | ---: | --- | --- | --- |\n| A | 12 | 19.5 | 2026-07-23 | 0012 | +886912345678 |\n| B | 8 | 20.0 | 2026-07-24 | 0013 | +886923456789 |\n")
	if err != nil {
		t.Fatalf("markdownToSpreadsheet: %v", err)
	}
	columns := input.Sheets[0].Columns
	if columns[1].Type != "integer" || columns[2].Type != "number" || columns[3].Type != "date" || columns[4].Type != "string" || columns[5].Type != "string" {
		t.Fatalf("column types = %+v", columns)
	}
}

func TestHandleDirectExportRejectsUnknownFormat(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/exports", strings.NewReader(`{"message_id":1,"format":"txt"}`))
	rec := httptest.NewRecorder()
	(&Plugin{}).handleDirectExport(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestHandleDirectExportHonorsFormatSwitch(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/exports", strings.NewReader(`{"message_id":1,"format":"pdf"}`))
	rec := httptest.NewRecorder()
	(&Plugin{toolCfg: &toolSettings{}}).handleDirectExport(rec, req)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusServiceUnavailable)
	}
}

func TestHandleDirectExportUsesZeroModelTokensAndOneRenderUsage(t *testing.T) {
	driverName := fmt.Sprintf("direct-export-%d", atomic.AddInt64(&directExportDriverID, 1))
	sql.Register(driverName, directExportTestDriver{})
	db, err := sql.Open(driverName, "")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()

	host := &directExportTestHost{}
	storage := NewObjectStorage(host)
	service := NewService(slog.Default(), db, host, storage, 0)
	settings := defaultToolSettings()
	settings.GenerateSpreadsheetEnabled = true
	settings.XLSXRenderFee = 0.03
	p := &Plugin{logger: slog.Default(), host: host, svc: service, toolCfg: &settings}

	req := httptest.NewRequest(http.MethodPost, "/exports", strings.NewReader(`{"message_id":42,"format":"xlsx"}`))
	req.Header.Set(headerUserID, "9")
	rec := httptest.NewRecorder()
	p.handleDirectExport(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
	var response struct {
		ModelTokens int     `json:"model_tokens"`
		RenderFee   float64 `json:"render_fee"`
		File        struct {
			AssetURI string `json:"asset_uri"`
		} `json:"file"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response.ModelTokens != 0 || response.RenderFee != 0.03 || response.File.AssetURI != "airgate-asset://asset/asset-export" {
		t.Fatalf("response = %+v", response)
	}
	if host.gatewayForwards != 0 || host.assetStores != 1 || host.usageRecords != 1 {
		t.Fatalf("host calls: gateway=%d assets=%d usage=%d", host.gatewayForwards, host.assetStores, host.usageRecords)
	}
	if host.usageRequest.IdempotencyKey != "document-render:asset-export" {
		t.Fatalf("idempotency key = %q", host.usageRequest.IdempotencyKey)
	}
	if got := host.usageRequest.Payload["user_cost"]; got != 0.03 {
		t.Fatalf("render user_cost = %#v", got)
	}
}

func TestAIFileGenerationUsesOneModelCallAndOneRenderUsage(t *testing.T) {
	driverName := fmt.Sprintf("ai-file-generation-%d", atomic.AddInt64(&directExportDriverID, 1))
	sql.Register(driverName, directExportTestDriver{})
	db, err := sql.Open(driverName, "")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()

	args := `{"title":"预算","sheets":[{"name":"数据","columns":[{"header":"项目"},{"header":"金额","type":"number"}],"rows":[["研发",120]]}]}`
	encodedArgs, _ := json.Marshal(args)
	host := &directExportTestHost{streamFrames: sseDataFrames(
		`{"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_xlsx","name":"generate_spreadsheet"}}`,
		fmt.Sprintf(`{"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":%s}}`, encodedArgs),
		`{"type":"message_delta","delta":{"stop_reason":"tool_use"}}`,
	)}
	storage := NewObjectStorage(host)
	service := NewService(slog.Default(), db, host, storage, 0)
	settings := defaultToolSettings()
	settings.GenerateSpreadsheetEnabled = true
	settings.XLSXRenderFee = 0.03
	p := &Plugin{logger: slog.Default(), host: host, svc: service, toolCfg: &settings}

	body := []byte(`{"model":"claude-sonnet-5","messages":[{"role":"user","content":"生成预算表"}],"stream":true,"conversation_id":7}`)
	req := httptest.NewRequest(http.MethodPost, "/chat/completions", nil)
	req.Header.Set(headerUserID, "9")
	rec := httptest.NewRecorder()
	var parsed openAIChatRequest
	_ = json.Unmarshal(body, &parsed)
	p.runToolLoop(req.Context(), rec, req, "claude", parsed, body, defaultCompileOpts(), p.enabledChatTools(), slog.Default())

	if host.gatewayForwards != 1 || host.assetStores != 1 || host.usageRecords != 1 {
		t.Fatalf("host calls: model=%d assets=%d render_usage=%d", host.gatewayForwards, host.assetStores, host.usageRecords)
	}
	if host.usageRequest.IdempotencyKey != "document-render:asset-export" {
		t.Fatalf("render usage idempotency = %q", host.usageRequest.IdempotencyKey)
	}
	out := rec.Body.String()
	for _, want := range []string{`"name":"预算.xlsx"`, `"iterations":1`, `"tool_calls":1`, `"document_render"`, `"user_cost":0.04`} {
		if !strings.Contains(out, want) {
			t.Fatalf("output missing %q:\n%s", want, out)
		}
	}
	var aggregated struct {
		Model   string    `json:"model"`
		Usage   sdk.Usage `json:"usage"`
		Airgate *struct {
			Iterations int `json:"iterations"`
		} `json:"airgate"`
	}
	for _, line := range strings.Split(out, "\n") {
		payload := strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(line), "data:"))
		if payload == "" || payload == "[DONE]" {
			continue
		}
		var candidate struct {
			Model   string    `json:"model"`
			Usage   sdk.Usage `json:"usage"`
			Airgate *struct {
				Iterations int `json:"iterations"`
			} `json:"airgate"`
		}
		if json.Unmarshal([]byte(payload), &candidate) == nil && candidate.Airgate != nil && candidate.Airgate.Iterations > 0 {
			aggregated = candidate
		}
	}
	if aggregated.Airgate == nil || aggregated.Usage.Model != "claude-sonnet-5" {
		t.Fatalf("aggregated model usage = %+v", aggregated)
	}
	metricValues := map[string]float64{}
	for _, metric := range aggregated.Usage.Metrics {
		metricValues[metric.Key] = metric.Value
	}
	if metricValues["output_tokens"] != 10 || metricValues["document_render"] != 1 {
		t.Fatalf("model tokens/render metric mixed: %+v", metricValues)
	}
}

func TestAIFileGenerationAllFormatsIntegration(t *testing.T) {
	cdpURL := strings.TrimSpace(os.Getenv("PLAYGROUND_CDP_URL"))
	officeURL := strings.TrimSpace(os.Getenv("PLAYGROUND_OFFICE_RENDERER_URL"))
	if cdpURL == "" || officeURL == "" {
		t.Skip("set PLAYGROUND_CDP_URL and PLAYGROUND_OFFICE_RENDERER_URL for real renderer QA")
	}
	qaDir := strings.TrimSpace(os.Getenv("PLAYGROUND_FILE_QA_DIR"))
	cases := []struct {
		format      string
		tool        string
		args        string
		contentType string
		signature   []byte
	}{
		{format: "pdf", tool: "generate_document", args: `{"title":"四格式验证 PDF","format":"pdf","content":"## 摘要\n\n中文正文 **精确保留**。\n\n| 项目 | 数量 |\n| --- | ---: |\n| A | 12 |"}`, contentType: "application/pdf", signature: []byte("%PDF")},
		{format: "docx", tool: "generate_document", args: "{\"title\":\"四格式验证 Word\",\"format\":\"docx\",\"content\":\"## 摘要\\n\\n中文正文 **精确保留**。\\n\\n```go\\nfunc main() {\\n    println(\\\"ok\\\")\\n}\\n```\"}", contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", signature: []byte("PK")},
		{format: "pptx", tool: "generate_presentation", args: `{"title":"四格式验证 PPT","slides":[{"kind":"title","title":"四格式验证 PPT","subtitle":"真实渲染"},{"kind":"content","title":"摘要","bullets":["中文正文精确保留","一次模型调用"]},{"kind":"table","title":"数据","table":{"headers":["项目","数量"],"rows":[["A","12"]]}}]}`, contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", signature: []byte("PK")},
		{format: "xlsx", tool: "generate_spreadsheet", args: `{"title":"四格式验证 Excel","sheets":[{"name":"数据","columns":[{"header":"项目"},{"header":"数量","type":"number"}],"rows":[["A",12]]}]}`, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", signature: []byte("PK")},
	}
	for _, tc := range cases {
		t.Run(tc.format, func(t *testing.T) {
			driverName := fmt.Sprintf("ai-file-%s-%d", tc.format, atomic.AddInt64(&directExportDriverID, 1))
			sql.Register(driverName, directExportTestDriver{})
			db, err := sql.Open(driverName, "")
			if err != nil {
				t.Fatal(err)
			}
			defer func() { _ = db.Close() }()

			encodedArgs, _ := json.Marshal(tc.args)
			host := &directExportTestHost{streamFrames: sseDataFrames(
				fmt.Sprintf(`{"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_%s","name":%q}}`, tc.format, tc.tool),
				fmt.Sprintf(`{"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":%s}}`, encodedArgs),
				`{"type":"message_delta","delta":{"stop_reason":"tool_use"}}`,
			)}
			storage := NewObjectStorage(host)
			service := NewService(slog.Default(), db, host, storage, 0)
			settings := defaultToolSettings()
			settings.GenerateDocumentEnabled = true
			settings.GenerateOfficeEnabled = true
			settings.GenerateSpreadsheetEnabled = true
			settings.PDFRenderFee = 0.03
			settings.DOCXRenderFee = 0.03
			settings.PPTXRenderFee = 0.03
			settings.XLSXRenderFee = 0.03
			p := &Plugin{
				logger: slog.Default(), host: host, svc: service, toolCfg: &settings,
				pdf: newPDFRenderer(cdpURL), office: newOfficeRenderer(officeURL),
			}

			body := []byte(`{"model":"claude-sonnet-5","messages":[{"role":"user","content":"生成文件"}],"stream":true,"conversation_id":7}`)
			req := httptest.NewRequest(http.MethodPost, "/chat/completions", nil)
			req.Header.Set(headerUserID, "9")
			rec := httptest.NewRecorder()
			var parsed openAIChatRequest
			_ = json.Unmarshal(body, &parsed)
			p.runToolLoop(req.Context(), rec, req, "claude", parsed, body, defaultCompileOpts(), p.enabledChatTools(), slog.Default())

			if host.gatewayForwards != 1 || host.assetStores != 1 || host.usageRecords != 1 {
				t.Fatalf("%s calls: model=%d assets=%d render_usage=%d", tc.format, host.gatewayForwards, host.assetStores, host.usageRecords)
			}
			if got, _ := host.usageRequest.Payload["format"].(string); got != tc.format {
				t.Fatalf("render usage format = %q, want %q", got, tc.format)
			}
			if host.storedType != tc.contentType || !strings.HasPrefix(string(host.storedData), string(tc.signature)) {
				t.Fatalf("stored %s file invalid: type=%q prefix=%q", tc.format, host.storedType, host.storedData[:min(len(host.storedData), 4)])
			}
			out := rec.Body.String()
			for _, want := range []string{`"iterations":1`, `"tool_calls":1`, `"output_tokens"`, `"value":10`, `"document_render"`, `"user_cost":0.04`, "data: [DONE]"} {
				if !strings.Contains(out, want) {
					t.Fatalf("%s output missing %q:\n%s", tc.format, want, out)
				}
			}
			if qaDir != "" {
				if err := os.MkdirAll(qaDir, 0o755); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(filepath.Join(qaDir, "current-ai-generated."+tc.format), host.storedData, 0o600); err != nil {
					t.Fatal(err)
				}
			}
		})
	}
}
