FROM ghcr.io/astral-sh/uv:latest AS uv


FROM python:3.13 AS builder

# Change the working directory to the `app` directory
WORKDIR /app

# Install dependencies
RUN --mount=from=uv,source=/uv,target=/bin/uv \
    --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv export --frozen --no-emit-workspace --no-dev --no-editable -o requirements.txt && \
    uv pip install -r requirements.txt --target /app

COPY service/ /app/service/
COPY templates/ /app/templates/
COPY assets/ /app/assets/

FROM python:3.13-slim
WORKDIR /app
COPY --from=builder /app/ /app/
EXPOSE 8000
ENV PYTHONUNBUFFERED=1
CMD ["python", "-m", "uvicorn", "service.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
LABEL org.opencontainers.image.source=https://github.com/radaron/CDMServer