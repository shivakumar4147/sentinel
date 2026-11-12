FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir flask prometheus-client

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
