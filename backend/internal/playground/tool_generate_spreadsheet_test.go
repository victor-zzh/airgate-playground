package playground

import (
	"bytes"
	"reflect"
	"strings"
	"testing"
	"unicode/utf8"

	"github.com/xuri/excelize/v2"
)

func TestRenderSpreadsheetCreatesTypedWorkbook(t *testing.T) {
	t.Parallel()
	data, err := renderSpreadsheet(spreadsheetInput{
		Title: "季度预算",
		Sheets: []spreadsheetSheet{{
			Name: "预算",
			Columns: []spreadsheetColumn{
				{Header: "项目", Type: "string"},
				{Header: "金额", Type: "number", Format: "currency"},
				{Header: "日期", Type: "date"},
			},
			Rows: [][]any{{"研发", 1234.5, "2026-07-23"}, {"=SUM(B2:B2)", 20, "2026-07-24"}},
		}},
	})
	if err != nil {
		t.Fatal(err)
	}
	book, err := excelize.OpenReader(bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = book.Close() }()
	if got, _ := book.GetCellValue("预算", "A2"); got != "研发" {
		t.Fatalf("A2 = %q", got)
	}
	if got, _ := book.GetCellValue("预算", "A3"); got != "=SUM(B2:B2)" {
		t.Fatalf("formula-like text must remain visible, A3 = %q", got)
	}
	if formula, _ := book.GetCellFormula("预算", "A3"); formula != "" {
		t.Fatalf("formula-like text must not become a formula: %q", formula)
	}
	if got, _ := book.GetCellValue("预算", "B2", excelize.Options{RawCellValue: true}); got != "1234.5" {
		t.Fatalf("B2 = %q", got)
	}
	panes, err := book.GetPanes("预算")
	if err != nil || !panes.Freeze || panes.YSplit != 1 {
		t.Fatalf("header pane not frozen: panes=%+v err=%v", panes, err)
	}
	headerStyle, err := book.GetCellStyle("预算", "A1")
	if err != nil || headerStyle == 0 {
		t.Fatalf("header style missing: style=%d err=%v", headerStyle, err)
	}
}

func TestRenderSpreadsheetRejectsUnsafeStructure(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name   string
		sheets []spreadsheetSheet
	}{
		{name: "invalid sheet name", sheets: []spreadsheetSheet{{Name: "a/b", Columns: []spreadsheetColumn{{Header: "x"}}}}},
		{name: "duplicate sheet name", sheets: []spreadsheetSheet{
			{Name: "Data", Columns: []spreadsheetColumn{{Header: "x"}}},
			{Name: "data", Columns: []spreadsheetColumn{{Header: "x"}}},
		}},
		{name: "too many cells", sheets: []spreadsheetSheet{{
			Name: "Data", Columns: []spreadsheetColumn{{Header: "x"}}, Rows: [][]any{{1, 2}},
		}}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			if _, err := renderSpreadsheet(spreadsheetInput{Title: "x", Sheets: tc.sheets}); err == nil {
				t.Fatal("expected validation error")
			}
		})
	}
}

func TestRenderSpreadsheetPreservesMultipleSheetsAndExpandsLongTextRows(t *testing.T) {
	t.Parallel()
	longText := strings.Repeat("中文说明 mixed text ", 20) + "END-MARKER"
	data, err := renderSpreadsheet(spreadsheetInput{
		Title: "多表工作簿",
		Sheets: []spreadsheetSheet{
			{Name: "摘要", Columns: []spreadsheetColumn{{Header: "说明", Width: 20}}, Rows: [][]any{{longText}}},
			{Name: "明细", Columns: []spreadsheetColumn{{Header: "项目"}, {Header: "金额", Type: "number"}}, Rows: [][]any{{"研发", 120.5}}},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	book, err := excelize.OpenReader(bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = book.Close() }()
	if got := book.GetSheetList(); !reflect.DeepEqual(got, []string{"摘要", "明细"}) {
		t.Fatalf("sheets = %#v", got)
	}
	if got, _ := book.GetCellValue("摘要", "A2"); got != longText {
		t.Fatalf("long text lost: got %d runes, want %d", utf8.RuneCountInString(got), utf8.RuneCountInString(longText))
	}
	if height, err := book.GetRowHeight("摘要", 2); err != nil || height <= 20 {
		t.Fatalf("long-text row height = %v, err = %v", height, err)
	}
	if got, _ := book.GetCellValue("明细", "B2", excelize.Options{RawCellValue: true}); got != "120.5" {
		t.Fatalf("typed value on second sheet = %q", got)
	}
}
