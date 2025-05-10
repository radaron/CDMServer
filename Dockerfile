FROM python:3.13 AS builder
WORKDIR /app
COPY service/ /app/service/
COPY templates/ /app/templates/
COPY static/ /app/static/
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --no-deps -r requirements.txt -t /app

FROM python:3.13-slim
WORKDIR /app
COPY --from=builder /app/ /app/
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "service.main:app", "--host", "0.0.0.0", "--port", "8000"]
LABEL org.opencontainers.image.source https://github.com/radaron/CDMServer