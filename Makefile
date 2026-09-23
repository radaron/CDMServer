reqs:
	uv sync --all-packages

reqs-ci:
	uv sync --all-packages --frozen

format:
	$(MAKE) -C webapp format
	$(MAKE) -C cli format
	$(MAKE) -C client format

check-format-ci:
	$(MAKE) -C webapp check-format-ci
	$(MAKE) -C cli check-format-ci
	$(MAKE) -C client check-format-ci

lint:
	$(MAKE) -C webapp lint
	$(MAKE) -C cli lint
	$(MAKE) -C client lint
