format:
	uv run ruff format CDMCli/
	uv run ruff check --fix CDMCli/

check-format-ci:
	uv run ruff format --check CDMCli/
	uv run ruff check CDMCli/

lint:
	uv run ruff check CDMCli/
	uv run ty check CDMCli/

bump:
	uv version --bump $(filter-out $@,$(MAKECMDGOALS))
