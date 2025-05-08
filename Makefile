# Finex Bot Makefile

.PHONY: dev api db:seed db:migrate lint test:contract test:unit test:e2e ci

# Spin up full stack (UI + API + workers + mocks)
dev:
	npm run dev

# Generate all OpenAPI routes from spec
api:
	npx @openapitools/openapi-generator-cli generate -i openapi/finex.yaml -g typescript-fetch -o lib/api
	@echo "API client generated successfully"

# Apply database migrations
db:migrate:
	npx prisma migrate dev

# Seed deterministic fixture data
db\:seed:
	npx prisma db seed

# Run linting
lint:
	npm run lint:fix

# Run contract tests
test\:contract:
	npm run test:contract

# Run unit tests
test\:unit:
	npm run test:unit

# Run E2E tests
test\:e2e:
	npx playwright test

# Run CI checks locally
ci:
	npm run lint
	npm run test
