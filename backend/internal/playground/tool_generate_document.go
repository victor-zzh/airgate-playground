package playground

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

// ── generate_document 工具 ────────────────────────────────────────────────────
// 模型产出 Markdown 报告 → 恒存 .md 资产;format=pdf 再经 goldmark→bluemonday
// →chromedp 转 A4 PDF。资产入 playground_assets(带会话归属,纳入孤儿清理与
// 会话删除链路)。边车不可用/渲染失败降级只出 MD。

const (
	maxDocumentContentBytes = 512 << 10
	maxDocumentPDFBytes     = 10 << 20
)

type generateDocumentTool struct {
	plugin *Plugin
}

func (t *generateDocumentTool) Name() string { return "generate_document" }

func (t *generateDocumentTool) Description() string {
	return "Create a downloadable document (report, summary, analysis) for the user. Write the full document content in Markdown (GFM tables and code blocks supported). The document is delivered to the user as a file card — after calling this tool, briefly summarize the key points instead of repeating the full content."
}

func (t *generateDocumentTool) InputSchema() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"title": map[string]any{
				"type":        "string",
				"description": "Document title, also used as the file name.",
			},
			"format": map[string]any{
				"type":        "string",
				"enum":        []string{"pdf", "markdown"},
				"description": "Output format (default pdf; markdown delivers the raw .md file).",
			},
			"content": map[string]any{
				"type":        "string",
				"description": "The complete document content in Markdown.",
			},
		},
		"required":             []string{"title", "content"},
		"additionalProperties": false,
	}
}

var docFilenameSanitizer = regexp.MustCompile(`[\\/:*?"<>|\x00-\x1f]+`)

func sanitizeDocumentTitle(title string) string {
	title = strings.TrimSpace(docFilenameSanitizer.ReplaceAllString(title, " "))
	title = strings.Join(strings.Fields(title), " ")
	if title == "" {
		return "document"
	}
	runes := []rune(title)
	if len(runes) > 80 {
		title = string(runes[:80])
	}
	return title
}

func (t *generateDocumentTool) Execute(ctx context.Context, tc *toolContext, args json.RawMessage) (*toolOutcome, error) {
	var input struct {
		Title   string `json:"title"`
		Format  string `json:"format"`
		Content string `json:"content"`
	}
	if err := json.Unmarshal(args, &input); err != nil || strings.TrimSpace(input.Content) == "" || strings.TrimSpace(input.Title) == "" {
		return &toolOutcome{ForModel: "generate_document 参数无效:需要非空 title 与 content(Markdown)", IsError: true}, nil
	}
	if tc.conversationID <= 0 {
		return &toolOutcome{ForModel: "当前请求缺少会话上下文,无法保存文档;请提示用户在会话中重试", IsError: true}, nil
	}
	if len(input.Content) > maxDocumentContentBytes {
		return &toolOutcome{ForModel: fmt.Sprintf("文档内容过大(%dKB),上限 512KB;请精简后重试", len(input.Content)>>10), IsError: true}, nil
	}
	storage := t.plugin.svc.Storage()
	if storage == nil {
		return &toolOutcome{ForModel: "文档存储不可用", IsError: true}, nil
	}

	title := sanitizeDocumentTitle(input.Title)
	format := strings.ToLower(strings.TrimSpace(input.Format))
	if format == "" {
		format = "pdf"
	}

	// 恒存 .md(PDF 失败时的兜底交付物,也方便用户二次编辑)
	mdAsset, err := storage.StoreDocumentBytes(ctx, int(tc.userID), "text/markdown", ".md", []byte(input.Content))
	if err != nil {
		tc.logger.Warn("generate_document_store_md_failed", "error", err)
		return &toolOutcome{ForModel: "文档保存失败,请稍后重试", IsError: true}, nil
	}
	if err := t.plugin.svc.RegisterConversationAsset(ctx, int(tc.userID), tc.conversationID, mdAsset); err != nil {
		tc.logger.Warn("generate_document_register_md_failed", "error", err)
	}

	deliver := mdAsset
	deliverName := title + ".md"
	deliverType := "text/markdown"
	pdfNote := ""
	if format == "pdf" {
		pdfAsset, pdfErr := t.renderAndStorePDF(ctx, tc, title, input.Content)
		if pdfErr != nil {
			tc.logger.Warn("generate_document_pdf_degraded", "error", pdfErr)
			pdfNote = "(PDF 转换暂不可用,已生成 Markdown 版本)"
		} else {
			deliver = pdfAsset
			deliverName = title + ".pdf"
			deliverType = "application/pdf"
		}
	}

	forClient := map[string]any{
		"file": map[string]any{
			"name":         deliverName,
			"content_type": deliverType,
			"size":         deliver.SizeBytes,
			// src=已解析公开 URL(前端直接下载);asset_uri=持久化到消息内容用
			// (<generated-file src="airgate-asset://..."/>,读取经 resolveAssetURLs)。
			"src":       deliver.PublicURL,
			"asset_uri": assetURI(deliver.ID),
		},
	}
	forModel := fmt.Sprintf("已生成文档《%s》(%s, %dKB)并作为文件卡片交付给用户%s。不要在回复中重复文档全文,只需简述要点。",
		title, strings.TrimPrefix(deliverType, "application/"), deliver.SizeBytes>>10, pdfNote)
	return &toolOutcome{ForModel: forModel, ForClient: forClient}, nil
}

func (t *generateDocumentTool) renderAndStorePDF(ctx context.Context, tc *toolContext, title, content string) (*StoredAsset, error) {
	renderer := t.plugin.pdf
	if renderer == nil {
		return nil, fmt.Errorf("pdf 渲染器未配置")
	}
	if !renderer.Healthy(ctx) {
		return nil, fmt.Errorf("chromium 边车不可达")
	}
	html, err := renderDocumentHTML(title, []byte(content))
	if err != nil {
		return nil, err
	}
	pdf, err := renderer.RenderPDF(ctx, html)
	if err != nil {
		return nil, err
	}
	if len(pdf) > maxDocumentPDFBytes {
		return nil, fmt.Errorf("pdf 超过 10MB 上限")
	}
	asset, err := t.plugin.svc.Storage().StoreDocumentBytes(ctx, int(tc.userID), "application/pdf", ".pdf", pdf)
	if err != nil {
		return nil, err
	}
	if err := t.plugin.svc.RegisterConversationAsset(ctx, int(tc.userID), tc.conversationID, asset); err != nil {
		tc.logger.Warn("generate_document_register_pdf_failed", "error", err)
	}
	return asset, nil
}
