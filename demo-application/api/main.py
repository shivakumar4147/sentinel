import os
import json
import time
import uuid
import secrets
import logging

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    generate_latest,
    CONTENT_TYPE_LATEST,
)


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./ecommerce.db"
)

# Use the pure-Python pg8000 driver for PostgreSQL.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+pg8000://",
        1,
    )

DEMO_USER_EMAIL = os.getenv(
    "DEMO_USER_EMAIL",
    "admin@example.com"
)

DEMO_USER_PASSWORD = os.getenv(
    "DEMO_USER_PASSWORD",
    "sentinel123"
)

# Controlled failure switch for bad-deployment demonstration.
SIMULATE_BAD_DEPLOYMENT = os.getenv(
    "SIMULATE_BAD_DEPLOYMENT",
    "false"
).lower() == "true"


engine_options = {
    "pool_pre_ping": True,
}

if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {
        "check_same_thread": False
    }

engine = create_engine(
    DATABASE_URL,
    **engine_options
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


# --------------------------------------------------
# LOGGING
# --------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ecommerce-api")


def log_event(event: str, **details):
    """Write structured JSON logs to stdout."""
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "ecommerce-api",
        "event": event,
        **details,
    }

    logger.info(json.dumps(entry))


# --------------------------------------------------
# DATABASE MODELS
# --------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=100)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)


# --------------------------------------------------
# PROMETHEUS METRICS
# --------------------------------------------------

REQUEST_COUNT = Counter(
    "ecommerce_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

REQUEST_LATENCY = Histogram(
    "ecommerce_http_request_duration_seconds",
    "HTTP request latency",
    ["endpoint"],
)

DATABASE_UP = Gauge(
    "ecommerce_database_up",
    "Database availability (1 = up, 0 = down)",
)


# --------------------------------------------------
# DATABASE HELPERS
# --------------------------------------------------

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def initialize_database():
    """Create tables and insert demo products."""

    try:
        Base.metadata.create_all(bind=engine)

        db = SessionLocal()

        try:
            perfume_products = [
                Product(
                    id=101,
                    name="L'AMOUR",
                    description="Centifolia roses, crystal peony, and luminous white musk.",
                    price=128.00,
                    stock=100,
                ),
                Product(
                    id=102,
                    name="ROSE NOIR",
                    description="Midnight black rose, rare Bourbon vanilla, and smoked oud.",
                    price=158.00,
                    stock=100,
                ),
                Product(
                    id=103,
                    name="EAU DE LUMIÈRE",
                    description="Sunlit bergamot, golden neroli blossom, and cashmere woods.",
                    price=128.00,
                    stock=100,
                ),
                Product(
                    id=104,
                    name="JARDIN SECRÈTE",
                    description="Dew-kissed freesia, white peach nectar, and green cedar leaves.",
                    price=118.00,
                    stock=100,
                ),
                Product(
                    id=105,
                    name="VÉLOURA INTENSE",
                    description="Roasted tonka bean, liquid amber resin, and golden saffron threads.",
                    price=168.00,
                    stock=100,
                ),
            ]

            for perfume in perfume_products:
                existing = db.query(Product).filter_by(id=perfume.id).first()

                if existing is None:
                    db.add(perfume)

            if db.query(User).filter_by(
                email=DEMO_USER_EMAIL
            ).first() is None:
                db.add(User(email=DEMO_USER_EMAIL))

            db.commit()

        finally:
            db.close()

        DATABASE_UP.set(1)
        log_event("database_initialized")

    except Exception:
        DATABASE_UP.set(0)
        logger.exception("Database initialization failed")


# --------------------------------------------------
# APPLICATION LIFECYCLE
# --------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="Sentinel Demo E-Commerce API",
    description="Sample e-commerce application monitored by Sentinel",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)


# --------------------------------------------------
# REQUEST LOGGING AND METRICS
# --------------------------------------------------

@app.middleware("http")
async def monitoring_middleware(request: Request, call_next):
    request_id = request.headers.get(
        "X-Request-ID",
        str(uuid.uuid4())
    )

    start_time = time.perf_counter()
    status_code = 500

    try:
        response = await call_next(request)
        status_code = response.status_code

    except Exception:
        log_event(
            "request_exception",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )
        raise

    finally:
        duration = time.perf_counter() - start_time

        route = request.scope.get("route")
        endpoint = getattr(route, "path", request.url.path)

        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=endpoint,
            status=str(status_code),
        ).inc()

        REQUEST_LATENCY.labels(
            endpoint=endpoint
        ).observe(duration)

        log_event(
            "http_request",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status=status_code,
            duration_ms=round(duration * 1000, 2),
        )

    response.headers["X-Request-ID"] = request_id

    return response


# --------------------------------------------------
# REQUEST SCHEMAS
# --------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class CheckoutRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, le=100)
    user_email: str


# --------------------------------------------------
# BASIC ENDPOINTS
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "application": "Sentinel Demo E-Commerce",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    """Liveness check."""

    return {
        "status": "healthy",
        "service": "ecommerce-api",
    }


@app.get("/ready")
def readiness(db: Session = Depends(get_db)):
    """Readiness check. Returns 503 if the database is unavailable."""

    try:
        db.execute(text("SELECT 1"))
        DATABASE_UP.set(1)

        return {
            "status": "ready",
            "database": "connected",
        }

    except Exception:
        DATABASE_UP.set(0)

        log_event("database_readiness_failed")

        raise HTTPException(
            status_code=503,
            detail="Database unavailable",
        )


# --------------------------------------------------
# PROMETHEUS METRICS ENDPOINT
# --------------------------------------------------

@app.get("/metrics")
def metrics():
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


# --------------------------------------------------
# PRODUCT ENDPOINTS
# --------------------------------------------------

@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    try:
        products = db.query(Product).all()

        return [
            {
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price": product.price,
                "stock": product.stock,
            }
            for product in products
        ]

    except Exception:
        logger.exception("Could not retrieve products")

        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve products",
        )


@app.get("/products/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return {
        "id": product.id,
        "name": product.name,
        "price": product.price,
        "stock": product.stock,
    }


# --------------------------------------------------
# LOGIN ENDPOINT
# --------------------------------------------------

@app.post("/login")
def login(data: LoginRequest):
    """Demo-only login. Not production authentication."""

    valid_email = secrets.compare_digest(
        data.email,
        DEMO_USER_EMAIL,
    )

    valid_password = secrets.compare_digest(
        data.password,
        DEMO_USER_PASSWORD,
    )

    if not (valid_email and valid_password):
        log_event(
            "login_failed",
            email=data.email,
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    log_event(
        "login_success",
        email=data.email,
    )

    return {
        "message": "Login successful",
        "authenticated": True,
        "email": data.email,
    }


# --------------------------------------------------
# CHECKOUT ENDPOINT
# --------------------------------------------------

@app.post("/checkout")
def checkout(
    data: CheckoutRequest,
    db: Session = Depends(get_db),
):
    """
    Creates an order and decreases product stock.

    When SIMULATE_BAD_DEPLOYMENT=true, deliberately
    returns HTTP 500 for Sentinel failure demonstrations.
    """

    # CONTROLLED BAD-DEPLOYMENT FAILURE
    if SIMULATE_BAD_DEPLOYMENT:
        log_event(
            "simulated_deployment_failure",
            endpoint="/checkout",
            error="Intentional HTTP 500 for Sentinel demonstration",
        )

        raise HTTPException(
            status_code=500,
            detail="Simulated bad deployment: checkout service failed",
        )

    try:
        product = db.query(Product).filter(
            Product.id == data.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found",
            )

        if product.stock < data.quantity:
            raise HTTPException(
                status_code=400,
                detail="Insufficient stock",
            )

        total = product.price * data.quantity

        order = Order(
            user_email=data.user_email,
            product_id=product.id,
            quantity=data.quantity,
            total_price=total,
            status="pending",
        )

        product.stock -= data.quantity

        db.add(order)
        db.commit()
        db.refresh(order)

        log_event(
            "order_created",
            order_id=order.id,
            product_id=product.id,
            quantity=data.quantity,
            total=total,
        )

        return {
            "message": "Order created successfully",
            "order_id": order.id,
            "product": product.name,
            "quantity": data.quantity,
            "total_price": total,
            "status": order.status,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        logger.exception("Checkout failed")

        raise HTTPException(
            status_code=503,
            detail="Checkout temporarily unavailable",
        )


# --------------------------------------------------
# ORDER ENDPOINT
# --------------------------------------------------

@app.get("/orders/{order_id}")
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(
        Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    return {
        "order_id": order.id,
        "user_email": order.user_email,
        "product_id": order.product_id,
        "quantity": order.quantity,
        "total_price": order.total_price,
        "status": order.status,
        "created_at": order.created_at,
    }


# --------------------------------------------------
# DATABASE FAILURE TEST ENDPOINT
# --------------------------------------------------

@app.get("/debug/database")
def database_test(db: Session = Depends(get_db)):
    """Demo diagnostic endpoint."""

    try:
        db.execute(text("SELECT 1"))

        return {
            "database": "working",
        }

    except Exception:
        DATABASE_UP.set(0)

        logger.exception("Database diagnostic failed")

        raise HTTPException(
            status_code=503,
            detail="Database connection failed",
        )