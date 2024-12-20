FROM python:3.12 AS builder
WORKDIR /app
COPY service /app
COPY templates /app
RUN pip install --no-cache-dir --no-deps -r requirements.txt -t /app

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /app/ /app/
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "service.main:app", "--host", "0.0.0.0", "--port", "8000"]