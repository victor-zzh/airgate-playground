package playground

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/chromedp/cdproto/emulation"
	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
)

// ── PDF 渲染(chromedp → headless-shell 边车) ────────────────────────────────
// 边车跑在 compose 的 internal 网络(无外网出口),配合禁 JS + 白名单清洗后的
// HTML,构成三层防护。边车不可用时调用方降级只出 Markdown。

type pdfRenderer struct {
	cdpURL  string
	sem     chan struct{}
	timeout time.Duration
}

func newPDFRenderer(cdpURL string) *pdfRenderer {
	cdpURL = strings.TrimRight(strings.TrimSpace(cdpURL), "/")
	if cdpURL == "" {
		return nil
	}
	return &pdfRenderer{
		cdpURL:  cdpURL,
		sem:     make(chan struct{}, 2), // 并发上限 2,防边车内存被打爆
		timeout: 45 * time.Second,
	}
}

// Healthy 探测边车 CDP 端点是否可达(短超时,失败即降级)。
func (r *pdfRenderer) Healthy(ctx context.Context) bool {
	probeCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(probeCtx, http.MethodGet, r.cdpURL+"/json/version", nil)
	if err != nil {
		return false
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return false
	}
	_ = resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

// RenderPDF 在边车里把自包含 HTML 渲染成 A4 PDF。每次渲染独立 tab,防状态泄漏。
func (r *pdfRenderer) RenderPDF(ctx context.Context, html []byte) ([]byte, error) {
	select {
	case r.sem <- struct{}{}:
		defer func() { <-r.sem }()
	case <-ctx.Done():
		return nil, ctx.Err()
	}

	renderCtx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()

	allocCtx, cancelAlloc := chromedp.NewRemoteAllocator(renderCtx, r.cdpURL)
	defer cancelAlloc()
	tabCtx, cancelTab := chromedp.NewContext(allocCtx)
	defer cancelTab()

	var pdf []byte
	err := chromedp.Run(tabCtx,
		emulation.SetScriptExecutionDisabled(true),
		chromedp.Navigate("about:blank"),
		chromedp.ActionFunc(func(ctx context.Context) error {
			tree, err := page.GetFrameTree().Do(ctx)
			if err != nil {
				return err
			}
			return page.SetDocumentContent(tree.Frame.ID, string(html)).Do(ctx)
		}),
		chromedp.ActionFunc(func(ctx context.Context) error {
			buf, _, err := page.PrintToPDF().
				WithPrintBackground(true).
				WithPaperWidth(8.27). // A4 英寸
				WithPaperHeight(11.69).
				WithMarginTop(0.6).
				WithMarginBottom(0.6).
				WithMarginLeft(0.55).
				WithMarginRight(0.55).
				Do(ctx)
			if err != nil {
				return err
			}
			pdf = buf
			return nil
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("pdf 渲染失败: %w", err)
	}
	return pdf, nil
}
