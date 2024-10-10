FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt /app/
RUN apt update && apt install -y gcc default-libmysqlclient-dev pkg-config
RUN pip install --no-cache-dir --no-deps -r requirements.txt
COPY . /app
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]