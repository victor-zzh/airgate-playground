package playground

import "testing"

func TestValidatePresentation(t *testing.T) {
	t.Parallel()
	valid := presentationInput{Title: "季度复盘", Slides: []presentationSlide{
		{Kind: "title", Title: "季度复盘", Subtitle: "2026 Q3"},
		{Kind: "content", Title: "进展", Bullets: []string{"完成交付"}},
		{Kind: "table", Title: "指标", Table: &presentationTable{Headers: []string{"指标", "值"}, Rows: [][]string{{"收入", "120"}}}},
	}}
	if err := validatePresentation(valid); err != nil {
		t.Fatal(err)
	}
	invalid := valid
	invalid.Slides[1].Bullets = make([]string, maxPresentationBullets+1)
	if err := validatePresentation(invalid); err == nil {
		t.Fatal("expected bullet limit error")
	}
}
