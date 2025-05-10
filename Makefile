VIRTUALENV = .venv
ACTIVATE = . $(VIRTUALENV)/bin/activate

.venv:
	python3.13 -m venv $(VIRTUALENV)
	$(ACTIVATE) && pip install --upgrade pip pip-tools

clean:
	rm -rf $(VIRTUALENV)

virtualenv: .venv

lock: virtualenv
	$(ACTIVATE) && pip-compile --upgrade --strip-extras --generate-hashes pyproject.toml --output-file requirements.txt
	$(ACTIVATE) && pip-compile --upgrade --strip-extras --generate-hashes --extra dev pyproject.toml --output-file requirements-dev.txt

reqs-fe:
	cd frontend && rm -rf node_modules && pnpm install

reqs:
	$(ACTIVATE) && pip install -r requirements-dev.txt

format:
	$(ACTIVATE) && black service/

lint:
	$(ACTIVATE) && python -m pylint service/
	cd frontend && pnpm lint

start-backend:
	source .env.sh && $(ACTIVATE) && uvicorn service.main:app --host 0.0.0.0 --port 8000 --reload

start-frontent:
	cd frontend && pnpm start

build-frontend:
	rm -rf assets/* templates/*
	cd frontend && pnpm build
	cp -r frontend/build/assets/ assets/
	cp frontend/build/index.html templates/index.html

docker-compose: build-frontend
	docker compose up --build
