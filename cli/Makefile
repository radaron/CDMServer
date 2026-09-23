format:
	uv run ruff format cdm_server_cli/
	uv run ruff check --fix cdm_server_cli/

check-format-ci:
	uv run ruff format --check cdm_server_cli/
	uv run ruff check cdm_server_cli/

lint:
	uv run ruff check cdm_server_cli/
	uv run ty check cdm_server_cli/

bump:
	uv version --bump $(filter-out $@,$(MAKECMDGOALS))
