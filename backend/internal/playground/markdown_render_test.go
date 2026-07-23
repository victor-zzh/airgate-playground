package playground

import (
	"strings"
	"testing"
)

func TestRenderDocumentHTMLSanitizesAndRenders(t *testing.T) {
	t.Parallel()
	md := "# 报告\n\n中文正文 **加粗**。\n\n| 列A | 列B |\n|---|---|\n| 1 | 2 |\n\n```go\nfmt.Println(\"hi\")\n```\n\n<script>alert(1)</script>\n<img src=x onerror=alert(2)>\n[link](javascript:alert(3))"
	html, err := renderDocumentHTML("2026 分析报告", []byte(md))
	if err != nil {
		t.Fatal(err)
	}
	got := string(html)
	for _, want := range []string{"2026 分析报告", "中文正文", "<strong>加粗</strong>", "<table>", "fmt.Println", "Noto Sans CJK SC"} {
		if !strings.Contains(got, want) {
			t.Fatalf("output missing %q", want)
		}
	}
	for _, want := range []string{"thead { display: table-header-group; }", "tr { page-break-inside: avoid;", "pre {"} {
		if !strings.Contains(got, want) {
			t.Fatalf("print pagination rule missing %q", want)
		}
	}
	if strings.Contains(got, "table { border-collapse: collapse; width: 100%; margin: 0.8em 0; page-break-inside: avoid") {
		t.Fatal("long tables must be allowed to span PDF pages")
	}
	for _, forbidden := range []string{"<script", "onerror", "javascript:alert"} {
		if strings.Contains(got, forbidden) {
			t.Fatalf("output must not contain %q:\n%s", forbidden, got)
		}
	}
}

func TestSanitizeDocumentTitle(t *testing.T) {
	t.Parallel()
	if got := sanitizeDocumentTitle(`a/b\c:d*e?"<>|`); strings.ContainsAny(got, `/\:*?"<>|`) {
		t.Fatalf("unsafe chars remain: %q", got)
	}
	if got := sanitizeDocumentTitle("   "); got != "document" {
		t.Fatalf("empty title fallback = %q", got)
	}
	long := strings.Repeat("长", 200)
	if got := sanitizeDocumentTitle(long); len([]rune(got)) != 80 {
		t.Fatalf("title should truncate to 80 runes, got %d", len([]rune(got)))
	}
}

func TestStripDuplicateLeadingTitle(t *testing.T) {
	t.Parallel()
	if got := stripDuplicateLeadingTitle("季度报告", "# 季度报告\n\n## 摘要\n正文"); got != "## 摘要\n正文" {
		t.Fatalf("duplicate title not stripped: %q", got)
	}
	onlyTitle := "# 季度报告"
	if got := stripDuplicateLeadingTitle("季度报告", onlyTitle); got != onlyTitle {
		t.Fatalf("title-only document must stay non-empty: %q", got)
	}
	content := "# 其他标题\n正文"
	if got := stripDuplicateLeadingTitle("季度报告", content); got != content {
		t.Fatalf("different heading must remain: %q", got)
	}
}
