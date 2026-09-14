format:
	uv run ruff format CDMServerCli/
	uv run ruff check --fix CDMServerCli/

check-format-ci:
	uv run ruff format --check CDMServerCli/
	uv run ruff check CDMServerCli/

lint:
	uv run ruff check CDMServerCli/
	uv run ty check CDMServerCli/

bump:
	uv version --bump $(filter-out $@,$(MAKECMDGOALS))
