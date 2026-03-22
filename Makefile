.PHONY: *
.DEFAULT_GOAL := help

SHELL := /bin/bash

##@ Setup

start: deps db dev ## Install deps, migrate, run dev server

deps: ## Install dependencies
	bun install

db: ## Run local DB migrations (removes existing DB first)
	rm -rf .wrangler/state/v3/d1/
	bun run db:migrate:local

db/remote: ## Run remote DB migrations
	bun run db:migrate:remote

##@ Development

dev: ## Start dev server
	bun run dev

build: ## Build for production
	bun run build

preview: ## Preview production build
	bun run preview

##@ Testing

test: ## Run all tests
	bun run test

test/repositories: ## Run repository tests
	bun run test:repositories

test/http: ## Run HTTP tests
	bun run test:http

test/usecases: ## Run usecase tests
	bun run test:usecases

t: test ## Alias for test

##@ Code Quality

typecheck: ## Run TypeScript type checking
	bun run typecheck

##@ Deployment

ship: ## Full deploy pipeline
	bun run ship

deploy: ## Deploy to Cloudflare
	bun run deploy

##@ Utilities

clean: ## Clean build artifacts
	rm -rf node_modules dist .wrangler

help: ## Show available targets
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } /^[a-zA-Z_\/-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
