format:
	uv run ruff format cdm_client/
	uv run ruff check --fix cdm_client/

check-format-ci:
	uv run ruff format --check cdm_client/
	uv run ruff check cdm_client/

lint:
	uv run ruff check cdm_client/
	uv run ty check cdm_client/

bump:
	uv version --bump $(filter-out $@,$(MAKECMDGOALS))
