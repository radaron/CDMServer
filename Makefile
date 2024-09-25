VIRTUALENV = .venv
ACTIVATE = source $(VIRTUALENV)/bin/activate


.venv:
	python3 -m venv $(VIRTUALENV)
	$(ACTIVATE) && pip install --upgrade pip pip-tools

clean:
	rm -rf $(VIRTUALENV)

virtualenv: .venv

lock: virtualenv
	$(ACTIVATE) && pip-compile --strip-extras --generate-hashes pyproject.toml --output-file requirements.txt
	$(ACTIVATE) && pip-compile --strip-extras --generate-hashes --extra dev pyproject.toml --output-file requirements-dev.txt

reqs:
	$(ACTIVATE) && pip install -r requirements-dev.txt