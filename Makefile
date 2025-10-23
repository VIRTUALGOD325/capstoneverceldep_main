# Simple dev workflow to run all services with one command

.PHONY: dev dev-build down logs restart

# Start stack (no rebuild)
dev:
	./scripts/dev.sh

# Start stack with rebuild
dev-build:
	./scripts/dev.sh --build

# Stop and remove containers
down:
	@if command -v docker-compose >/dev/null 2>&1; then docker-compose down; else docker compose down; fi

# Tail logs for all services
logs:
	@if command -v docker-compose >/dev/null 2>&1; then docker-compose logs -f; else docker compose logs -f; fi

# Restart stack (recreates)
restart: down dev