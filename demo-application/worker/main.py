import json
import logging
import os
import time
from datetime import datetime, timezone

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+pg8000://ecommerce_user:demo_password@database:5432/ecommerce"
)

WORKER_INTERVAL = int(os.getenv("WORKER_INTERVAL", "10"))

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ecommerce-worker")


def log_event(event, **details):
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "ecommerce-worker",
        "event": event,
        **details,
    }
    logger.info(json.dumps(record))


def run_worker():
    log_event("worker_started")

    while True:
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))

            log_event("database_check_success")

        except Exception as error:
            log_event(
                "database_check_failed",
                error=str(error),
            )

        time.sleep(WORKER_INTERVAL)


if __name__ == "__main__":
    run_worker()
