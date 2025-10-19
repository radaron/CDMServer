reqs-fe:
	export NVM_DIR="$$HOME/.nvm" && \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh" && \
	cd frontend && \
	rm -rf node_modules && \
	nvm use && \
	pnpm install

reqs: reqs-fe
	uv sync --dev

format:
	export NVM_DIR="$$HOME/.nvm" && \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh" && \
	cd frontend && \
	nvm use && \
	pnpm format
	uv run ruff format service/
	uv run ruff check --select I --fix service/

check-format-ci:
	uv run ruff format --check service/
	uv run ruff check --select I service/
	cd frontend && pnpm format:check

lint:
	uv run ruff check service/

start-backend:
	source .env.sh && uv run uvicorn service.main:app --host 0.0.0.0 --port 8000 --reload

start-frontend:
	cd frontend && pnpm start

build-frontend:
	rm -rf assets/* templates/*
	export NVM_DIR="$$HOME/.nvm" && \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh" && \
	cd frontend && \
	nvm use && \
	pnpm build
	cp -r frontend/build/assets/ assets/
	cp frontend/build/index.html templates/index.html

build-frontend-fe:
	rm -rf assets/* templates/*
	cd frontend && pnpm build
	cp -r frontend/build/assets/ assets/
	cp frontend/build/index.html templates/index.html

docker-compose: build-frontend
	docker compose up --build

bump:
	uv version --bump $(filter-out $@,$(MAKECMDGOALS))
