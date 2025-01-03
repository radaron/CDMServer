VIRTUALENV = .venv
ACTIVATE = source $(VIRTUALENV)/bin/activate


.venv:
	python3 -m venv $(VIRTUALENV)
	$(ACTIVATE) && pip install --upgrade pip pip-tools

clean:
	rm -rf $(VIRTUALENV)

virtualenv: .venv

lock: virtualenv
	$(ACTIVATE) && pip-compile --upgrade --strip-extras --generate-hashes pyproject.toml --output-file requirements.txt
	$(ACTIVATE) && pip-compile --upgrade --strip-extras --generate-hashes --extra dev pyproject.toml --output-file requirements-dev.txt

reqs:
	$(ACTIVATE) && pip install -r requirements-dev.txt

format:
	$(ACTIVATE) && black service/

lint:
	$(ACTIVATE) && python -m pylint service/

start-backend:
	source .env.sh && $(ACTIVATE) && uvicorn service.main:app --host 0.0.0.0 --port 8000 --reload

start-frontent:
	cd frontend && npm start

start-db:
	docker compose up