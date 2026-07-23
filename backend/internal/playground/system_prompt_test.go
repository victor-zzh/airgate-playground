package playground

import (
	"strings"
	"testing"
)

func TestChatSystemPromptTextUsesBrandNeutralBuiltin(t *testing.T) {
	got := chatSystemPromptText("")
	if !strings.Contains(got, "capable AI assistant") {
		t.Fatalf("builtin prompt missing neutral identity: %q", got)
	}
	if strings.Contains(got, "HopBase") || strings.Contains(got, "Essevin") {
		t.Fatalf("builtin prompt must stay brand neutral: %q", got)
	}
	if !strings.Contains(got, "PDF/Word, Excel, or PowerPoint") || !strings.Contains(got, "do not invent missing data") {
		t.Fatalf("builtin prompt missing file accuracy rules: %q", got)
	}
}

func TestChatSystemPromptTextAppendsAdminInstructions(t *testing.T) {
	const custom = "Keep the tone warm and professional."
	got := chatSystemPromptText("  " + custom + "  ")
	if !strings.HasPrefix(got, builtinChatSystemPrompt) {
		t.Fatalf("custom prompt replaced the builtin baseline: %q", got)
	}
	if !strings.Contains(got, "Additional administrator instructions:\n"+custom) {
		t.Fatalf("custom prompt was not appended: %q", got)
	}
}
