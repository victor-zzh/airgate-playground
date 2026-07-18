package playground

import (
	"context"
	"testing"
)

func TestResolveCDPURLKeepsLiteralHosts(t *testing.T) {
	cases := map[string]string{
		"http://127.0.0.1:9222":   "http://127.0.0.1:9222", // 已是 IP,原样
		"http://localhost:9222":   "http://localhost:9222", // localhost 放行,原样
		"http://[::1]:9222":       "http://[::1]:9222",     // IPv6 字面量,原样
		"":                        "",                      // 空值原样(newPDFRenderer 已挡空,双保险)
		"http://192.168.1.5:9222": "http://192.168.1.5:9222",
	}
	for in, want := range cases {
		r := &pdfRenderer{cdpURL: in}
		if got := r.resolveCDPURL(context.Background()); got != want {
			t.Errorf("resolveCDPURL(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestResolveCDPURLResolvesHostnameToIP(t *testing.T) {
	// localhost 之外的主机名走 DNS 解析;用 localhost 的别名做稳定验证:
	// 传入一个必然解析成 127.0.0.1 的名字不现实,故这里验证解析失败时的兜底——
	// 不可解析的主机名原样返回,让后续探测自然失败降级(不 panic、不空串)。
	r := &pdfRenderer{cdpURL: "http://nonexistent.invalid:9222"}
	if got := r.resolveCDPURL(context.Background()); got != "http://nonexistent.invalid:9222" {
		t.Errorf("解析失败应原样返回, got %q", got)
	}
}
