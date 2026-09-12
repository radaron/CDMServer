reqs-fe:
	export NVM_DIR="$$HOME/.nvm" && \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh" && \
	cd frontend && \
	rm -rf node_modules && \
	nvm use && \
	pnpm install

reqs: reqs-fe
	uv sync --dev

reqs-fe-ci:
	cd frontend && pnpm install --frozen-lockfile

reqs-ci: reqs-fe-ci
	uv sync --dev --frozen

format:
	export NVM_DIR="$$HOME/.nvm" && \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh" && \
	cd frontend && \
	nvm use && \
	pnpm format
	uv run ruff format service/ worker/
	uv run ruff check --fix service/ worker/
	cd cli && uv run ruff format CDMServerCli/
	cd cli && uv run ruff check --fix CDMServerCli/

check-format-ci:
	uv run ruff format --check service/ worker/
	uv run ruff check service/ worker/
	cd cli && uv run ruff format --check CDMServerCli/
	cd cli && uv run ruff check CDMServerCli/
	cd frontend && pnpm format:check

lint:
	uv run ruff check service/ worker/
	cd cli && uv run ruff check CDMServerCli/
	uv run ty check service/ worker/
	cd cli && uv run ty check CDMServerCli/

start-backend:
	source .env.sh && uv run uvicorn service.main:app --host 0.0.0.0 --port 8000 --reload

start-frontend:
	cd frontend && pnpm start

build-frontend:
	rm -rf assets/* templates/index.html
	export NVM_DIR="$$HOME/.nvm" && \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh" && \
	cd frontend && \
	nvm use && \
	pnpm build
	cp -r frontend/build/assets/ assets/
	cp frontend/build/index.html templates/index.html

build-frontend-ci:
	rm -rf assets/* templates/index.html
	cd frontend && pnpm build
	cp -r frontend/build/assets/ assets/
	cp frontend/build/index.html templates/index.html

docker-compose: build-frontend
	docker compose up --build

bump:
	uv version --bump $(filter-out $@,$(MAKECMDGOALS))

bump-cli:
	cd cli && uv version --bump $(filter-out $@,$(MAKECMDGOALS))
