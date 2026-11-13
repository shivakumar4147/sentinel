FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir sqlalchemy pg8000

COPY main.py .

CMD ["python", "main.py"]
