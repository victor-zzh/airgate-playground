package playground

import (
	"embed"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

//go:embed all:webdist
var webDistFS embed.FS

func (p *Plugin) GetWebAssets() map[string][]byte {
	if assets := loadDevAssets(); len(assets) > 0 {
		return assets
	}
	assets := make(map[string][]byte)
	_ = fs.WalkDir(webDistFS, "webdist", func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		content, err := webDistFS.ReadFile(path)
		if err != nil {
			return nil
		}
		rel := strings.TrimPrefix(path, "webdist/")
		if rel == ".gitkeep" || rel == "" {
			return nil
		}
		assets[rel] = content
		return nil
	})
	return assets
}

func loadDevAssets() map[string][]byte {
	candidates := []string{
		filepath.Join("..", "web", "dist"),
		filepath.Join("web", "dist"),
	}
	for _, dir := range candidates {
		if a := loadAssetsFromDir(dir); len(a) > 0 {
			return a
		}
	}
	return nil
}

func loadAssetsFromDir(root string) map[string][]byte {
	info, err := os.Stat(root)
	if err != nil || !info.IsDir() {
		return nil
	}
	out := make(map[string][]byte)
	_ = filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil || info == nil || info.IsDir() {
			return nil
		}
		content, readErr := os.ReadFile(path)
		if readErr != nil {
			return nil
		}
		rel, relErr := filepath.Rel(root, path)
		if relErr != nil {
			return nil
		}
		out[filepath.ToSlash(rel)] = content
		return nil
	})
	if len(out) == 0 {
		return nil
	}
	return out
}
