package playground

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	sdk "github.com/DouDOU-start/airgate-sdk/sdkgo"
)

// ── generate_document 工具 ────────────────────────────────────────────────────
// 模型产出受控 Markdown，按请求生成 Markdown/PDF/DOCX。PDF 经 Chromium，
// DOCX 经 office-renderer；请求哪种格式就必须交付哪种格式，失败不降级冒充。

const (
	maxDocumentContentBytes = 512 << 10
	maxDocumentPDFBytes     = 10 << 20
	maxDocumentDOCXBytes    = 20 << 20
)

type generateDocumentTool struct {
	plugin  *Plugin
	formats []string
}

func (t *generateDocumentTool) Name() string { return "generate_document" }

func (t *generateDocumentTool) Description() string {
	return fmt.Sprintf("Create a downloadable %s document. Write the full content in Markdown (GFM tables and code blocks supported). The file card completes the response, so do not add a summary after calling the tool.", strings.Join(t.supportedFormats(), "/"))
}

func (t *generateDocumentTool) InputSchema() map[string]any {
	formats := t.supportedFormats()
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"title": map[string]any{
				"type":        "string",
				"description": "Document title, also used as the file name.",
			},
			"format": map[string]any{
				"type":        "string",
				"enum":        formats,
				"description": "Required output format. Use docx for Microsoft Word.",
			},
			"content": map[string]any{
				"type":        "string",
				"description": "The complete document content in Markdown.",
			},
		},
		"required":             []string{"title", "format", "content"},
		"additionalProperties": false,
	}
}

func (t *generateDocumentTool) supportedFormats() []string {
	if len(t.formats) == 0 {
		return []string{"pdf", "markdown"}
	}
	return append([]string(nil), t.formats...)
}

func (t *generateDocumentTool) supportsFormat(format string) bool {
	for _, candidate := range t.supportedFormats() {
		if candidate == format {
			return true
		}
	}
	return false
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
	if err := json.Unmarshal(args, &input); err != nil || strings.TrimSpace(input.Content) == "" || strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Format) == "" {
		return &toolOutcome{ForModel: "generate_document 参数无效:需要非空 title、format 与 content(Markdown)", IsError: true}, nil
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
	if !t.supportsFormat(format) {
		return &toolOutcome{ForModel: fmt.Sprintf("不支持格式 %q，可用格式：%s", format, strings.Join(t.supportedFormats(), ", ")), IsError: true}, nil
	}

	var deliver *StoredAsset
	var deliverName, deliverType string
	var err error
	renderContent := stripDuplicateLeadingTitle(title, input.Content)
	switch format {
	case "markdown":
		deliver, err = storage.StoreDocumentBytes(ctx, int(tc.userID), "text/markdown", ".md", []byte(input.Content))
		deliverName, deliverType = title+".md", "text/markdown"
	case "pdf":
		deliver, err = t.renderAndStorePDF(ctx, tc, title, renderContent)
		deliverName, deliverType = title+".pdf", "application/pdf"
	case "docx":
		deliver, err = t.renderAndStoreDOCX(ctx, tc, title, renderContent)
		deliverName, deliverType = title+".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	}
	if err != nil {
		tc.logger.Warn("generate_document_failed", "format", format, "error", err)
		return &toolOutcome{ForModel: fmt.Sprintf("%s 文件生成失败：%v", strings.ToUpper(format), err), IsError: true}, nil
	}
	if format == "markdown" {
		if err := t.plugin.svc.RegisterConversationAsset(ctx, int(tc.userID), tc.conversationID, deliver); err != nil {
			tc.logger.Warn("generate_document_register_markdown_failed", "error", err)
			_ = storage.Delete(ctx, deliver.ObjectKey)
			return &toolOutcome{ForModel: "文档已生成但会话资产登记失败，请稍后重试", IsError: true}, nil
		}
	}
	var usage *sdk.Usage
	if format != "markdown" {
		usage, err = t.plugin.chargeRenderUsage(ctx, tc, format, deliver.ID, deliver.SizeBytes, 1)
		if err != nil {
			_ = t.plugin.svc.RemoveConversationAsset(ctx, int(tc.userID), tc.conversationID, deliver)
			return &toolOutcome{ForModel: fmt.Sprintf("%s 已渲染但文件费用入账失败：%v", strings.ToUpper(format), err), IsError: true}, nil
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
	forModel := fmt.Sprintf("已生成文档《%s》(%s, %dKB)并作为文件卡片交付给用户。",
		title, strings.ToUpper(format), deliver.SizeBytes>>10)
	return &toolOutcome{
		ForModel:        forModel,
		ForClient:       forClient,
		Terminal:        true,
		TerminalMessage: "文件已生成，可通过文件卡下载。",
		Usage:           usage,
	}, nil
}

func stripDuplicateLeadingTitle(title, content string) string {
	trimmed := strings.TrimLeft(content, " \t\r\n")
	lineEnd := strings.IndexByte(trimmed, '\n')
	firstLine := trimmed
	if lineEnd >= 0 {
		firstLine = trimmed[:lineEnd]
	}
	heading := strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(firstLine), "#"))
	if !strings.HasPrefix(strings.TrimSpace(firstLine), "# ") || !strings.EqualFold(heading, strings.TrimSpace(title)) {
		return content
	}
	if lineEnd < 0 {
		return content
	}
	rest := strings.TrimLeft(trimmed[lineEnd+1:], "\r\n")
	if rest == "" {
		// Keep a title-only document valid for DOCX/renderer implementations
		// that require non-empty body content.
		return content
	}
	return rest
}

func (t *generateDocumentTool) renderAndStoreDOCX(ctx context.Context, tc *toolContext, title, content string) (*StoredAsset, error) {
	renderer := t.plugin.office
	if renderer == nil || !renderer.Healthy(ctx) {
		return nil, fmt.Errorf("Office renderer 不可达")
	}
	docx, err := renderer.RenderDOCX(ctx, title, content)
	if err != nil {
		return nil, err
	}
	if len(docx) > maxDocumentDOCXBytes {
		return nil, fmt.Errorf("DOCX 超过 20MB 上限")
	}
	asset, err := t.plugin.svc.Storage().StoreDocumentBytes(ctx, int(tc.userID), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx", docx)
	if err != nil {
		return nil, err
	}
	if err := t.plugin.svc.RegisterConversationAsset(ctx, int(tc.userID), tc.conversationID, asset); err != nil {
		tc.logger.Warn("generate_document_register_docx_failed", "error", err)
		_ = t.plugin.svc.Storage().Delete(ctx, asset.ObjectKey)
		return nil, fmt.Errorf("会话资产登记失败: %w", err)
	}
	return asset, nil
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
		_ = t.plugin.svc.Storage().Delete(ctx, asset.ObjectKey)
		return nil, fmt.Errorf("会话资产登记失败: %w", err)
	}
	return asset, nil
}
