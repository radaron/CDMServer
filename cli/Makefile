format:
	uv run ruff format cdmctl/
	uv run ruff check --fix cdmctl/

check-format-ci:
	uv run ruff format --check cdmctl/
	uv run ruff check cdmctl/

lint:
	uv run ruff check cdmctl/
	uv run ty check cdmctl/

bump:
	uv version --bump $(filter-out $@,$(MAKECMDGOALS))
