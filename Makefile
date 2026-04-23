GO := GOTOOLCHAIN=local go

.PHONY: help install build build-web build-backend release ci pre-commit lint fmt test vet setup-hooks clean

help: ## 显示帮助信息
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## 安装前后端依赖
	cd web && npm install
	cd backend && $(GO) mod download

build: build-web build-backend ## 完整构建

build-web: ## 构建前端
	cd web && npm run build

build-backend: build-web ## 构建后端并复制前端产物
	rm -rf backend/internal/playground/webdist
	cp -r web/dist backend/internal/playground/webdist
	mkdir -p bin
	cd backend && $(GO) build -o ../bin/airgate-playground .

release: build-web ## 构建 Linux 发布产物
	rm -rf backend/internal/playground/webdist
	cp -r web/dist backend/internal/playground/webdist
	mkdir -p bin
	cd backend && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GO) build -buildvcs=false -trimpath -ldflags "-X 'github.com/DouDOU-start/airgate-playground/backend/internal/playground.PluginVersion=$${VERSION:-dev}'" -o ../bin/airgate-playground-linux-amd64 .

ci: lint test vet build-backend ## 本地运行与 CI 一致的检查

pre-commit: lint test vet ## pre-commit hook 调用

lint: ## 代码检查
	@if ! command -v golangci-lint > /dev/null 2>&1; then \
		echo "错误: 未安装 golangci-lint，请执行: go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@latest"; \
		exit 1; \
	fi
	@cd backend && golangci-lint run ./...
	@cd web && npm run type-check

fmt: ## 格式化代码
	@cd backend && $(GO) fmt ./...

test: ## 运行测试
	@cd backend && $(GO) test ./...

vet: ## 静态分析
	@cd backend && $(GO) vet ./...

setup-hooks: ## 安装 Git pre-commit hook
	@echo '#!/bin/sh' > .git/hooks/pre-commit
	@echo 'make pre-commit' >> .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit

clean: ## 清理构建产物
	rm -rf backend/internal/playground/webdist bin/
