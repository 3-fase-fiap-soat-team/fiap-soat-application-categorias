.PHONY: init init-local init-rds clean test-rds migrate-up migrate-down migrate-create build logs logs-db status help

MIGRATION_PATH=migrations

# Local development with PostgreSQL container (default)
init:
	@echo "Starting local development environment..."
	@$(MAKE) init-local

init-local:
	@echo "Starting PostgreSQL container..."
	docker compose --profile local up -d postgres-dev
	@echo "Running migrations..."
	docker compose --profile local run --rm --no-deps api-dev npm run migration:up
	@echo "Starting application with local database..."
	docker compose --profile local up api-dev

# Development with AWS RDS (requires RDS to be provisioned)
init-rds:
	@echo "Starting application with AWS RDS connection..."
	@echo "Note: Make sure RDS is provisioned and .env.rds is configured"
	docker compose --profile rds up api-rds

# Test RDS connection without starting containers
test-rds:
	@echo "Testing RDS connection..."
	@if [ ! -f .env.rds ]; then \
		echo "Error: .env.rds file not found. Copy from .env.example and configure."; \
		exit 1; \
	fi
	docker compose --profile rds run --rm api-rds npm run migration:up

clean:
	@echo "Stopping and removing all containers..."
	docker compose --profile local down --rmi all --volumes --remove-orphans
	docker compose --profile rds down --rmi all --volumes --remove-orphans
	docker compose down --rmi all --volumes --remove-orphans
	@echo "Cleaning up any remaining containers..."
	@docker system prune -f || true

migrate-up:
	docker compose run --rm --no-deps api-dev npm run migration:up

migrate-down:
	docker compose run --rm --no-deps api-dev npm run migration:down

migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "You must provide a migration name: make migrate-create name=MinhaMigration"; \
		exit 1; \
	fi
	docker compose run --rm --no-deps api-dev npm run migration:create -- $(MIGRATION_PATH)/$(name)
	@echo "Migration created: $(MIGRATION_PATH)/$(name)"
	@echo "Run 'make migrate-up' to apply the migration."

# Debug and utility commands
build:
	@echo "Building application..."
	docker compose --profile local build --no-cache

logs:
	@echo "Showing application logs..."
	docker compose --profile local logs -f api-dev

logs-db:
	@echo "Showing database logs..."
	docker compose --profile local logs -f postgres-dev

status:
	@echo "Container status:"
	@docker ps -a --filter "name=fiap-soat-application"
	@echo ""
	@echo "Images:"
	@docker images | grep fiap-soat-application || echo "No images found"

help:
	@echo "Available commands:"
	@echo "  make init       - Start local development (default)"
	@echo "  make init-local - Start with local PostgreSQL"
	@echo "  make init-rds   - Start with AWS RDS"
	@echo "  make test-rds   - Test RDS connection"
	@echo "  make clean      - Remove all containers and images"
	@echo "  make build      - Build application image"
	@echo "  make logs       - Show application logs"
	@echo "  make logs-db    - Show database logs"
	@echo "  make status     - Show containers and images status"
	@echo "  make migrate-up - Run database migrations"
	@echo "  make migrate-create name=MigrationName - Create new migration"