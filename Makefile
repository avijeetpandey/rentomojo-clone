# Rentomojo clone — top-level developer ergonomics.
# Default target spins up the full stack via podman-compose.

SHELL := /bin/bash
COMPOSE ?= podman-compose
COMPOSE_FILE := compose.yaml

.DEFAULT_GOAL := help

.PHONY: help run up down logs ps build rebuild clean \
        install install-backend install-client \
        dev-backend dev-client dev-electron \
        test test-backend test-client \
        db-only prisma-generate prisma-migrate \
        k8s-apply k8s-delete k8s-status

help: ## Show this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

run: up ## Alias for `up` — boot the entire stack (DB + backend + client).

up: ## Build & start db, backend and client containers via podman-compose.
	$(COMPOSE) -f $(COMPOSE_FILE) up --build -d
	@echo ""
	@echo "Stack is starting:"
	@echo "  - Postgres : localhost:5432  (user/pass: rentomojo/rentomojo)"
	@echo "  - Backend  : http://localhost:4000/health"
	@echo "  - Client   : http://localhost:5173"
	@echo ""
	@echo "Tail logs with:  make logs"

down: ## Stop and remove containers (keeps volumes).
	$(COMPOSE) -f $(COMPOSE_FILE) down

clean: ## Stop and remove containers AND volumes.
	$(COMPOSE) -f $(COMPOSE_FILE) down -v

logs: ## Tail logs from all services.
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f --tail=100

ps: ## Show running services.
	$(COMPOSE) -f $(COMPOSE_FILE) ps

build: ## Rebuild container images without starting them.
	$(COMPOSE) -f $(COMPOSE_FILE) build

rebuild: clean build up ## Nuke, rebuild, restart.

db-only: ## Run only the Postgres database (useful for local node dev).
	$(COMPOSE) -f $(COMPOSE_FILE) up -d db

install: install-backend install-client ## Install node deps for backend & client.

install-backend: ## Install backend deps.
	cd backend && npm install

install-client: ## Install client deps.
	cd client && npm install

dev-backend: ## Run backend in watch mode (requires `make db-only` first).
	cd backend && npm run dev

dev-client: ## Run client (Vite) in dev mode.
	cd client && npm run dev

dev-electron: ## Run client inside the Electron shell.
	cd client && npm run dev:electron

prisma-generate: ## Generate Prisma client.
	cd backend && npm run prisma:generate

prisma-migrate: ## Run Prisma migrations against the local DB.
	cd backend && npm run prisma:migrate

test: test-backend test-client ## Run all tests.

test-backend: ## Run backend tests.
	cd backend && npm test

test-client: ## Run client tests.
	cd client && npm test

k8s-apply: ## Apply all Kubernetes manifests in order (namespace → config → secrets → postgres → backend → client → ingress).
	kubectl apply -f infra/k8s/namespace.yaml
	kubectl apply -f infra/k8s/configmap.yaml
	kubectl apply -f infra/k8s/secret.yaml
	kubectl apply -f infra/k8s/postgres/
	kubectl rollout status deployment/postgres -n rentomojo --timeout=120s
	kubectl apply -f infra/k8s/backend/
	kubectl rollout status deployment/rentomojo-backend -n rentomojo --timeout=180s
	kubectl apply -f infra/k8s/client/
	kubectl apply -f infra/k8s/ingress.yaml
	@echo ""
	@echo "Stack deployed to namespace 'rentomojo'. Check status with: make k8s-status"

k8s-delete: ## Tear down all Kubernetes resources in the rentomojo namespace.
	kubectl delete namespace rentomojo --ignore-not-found

k8s-status: ## Show pod and service status in the rentomojo namespace.
	@echo "=== Pods ===" && kubectl get pods -n rentomojo
	@echo ""
	@echo "=== Services ===" && kubectl get svc -n rentomojo
	@echo ""
	@echo "=== Ingress ===" && kubectl get ingress -n rentomojo
