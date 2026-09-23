FROM ghcr.io/astral-sh/uv:latest AS uv


FROM python:3.13 AS builder

WORKDIR /app

RUN --mount=from=uv,source=/uv,target=/bin/uv \
    --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=/ws/uv.lock \
    --mount=type=bind,source=pyproject.toml,target=/ws/pyproject.toml \
    --mount=type=bind,source=webapp/pyproject.toml,target=/ws/webapp/pyproject.toml \
    uv export --directory /ws --package cdmserver --frozen --no-emit-workspace --no-dev --no-editable -o /app/requirements.txt && \
    uv pip install -r requirements.txt --target /app

COPY webapp/service/ /app/service/
COPY webapp/worker/ /app/worker/
COPY webapp/templates/ /app/templates/
COPY webapp/assets/ /app/assets/

FROM python:3.13-slim
WORKDIR /app
COPY --from=builder /app/ /app/
EXPOSE 8000
ENV PYTHONUNBUFFERED=1
CMD ["python", "-m", "uvicorn", "service.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info", "--proxy-headers", "--forwarded-allow-ips", "*"]
LABEL org.opencontainers.image.source=https://github.com/radaron/CDMServer
