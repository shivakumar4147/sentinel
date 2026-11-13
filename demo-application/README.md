# Member 4: Target Demo Application & Failure Scenarios

## 1. Overview

This directory contains a sample cloud-native e-commerce application designed to demonstrate Sentinel's monitoring, incident detection, investigation, and recovery capabilities.

The application is called **Veloura Parfums**, a luxury perfume e-commerce demo.

It includes:
- React frontend
- Python FastAPI backend
- PostgreSQL database
- Background database-monitoring worker
- Prometheus metrics collection
- cAdvisor container resource monitoring
- Docker-based deployment
- Controlled failure and recovery scenarios

## 2. Project Architecture

```text
demo-application/
│
├── api/
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── worker/
│   ├── main.py
│   └── Dockerfile
│
├── database/
│
├── monitoring/
│   └── prometheus.yml
│
├── failure-scenarios/
│   ├── trigger-bad-deployment.ps1
│   ├── reset-bad-deployment.ps1
│   ├── trigger-database-failure.ps1
│   ├── reset-database-failure.ps1
│   ├── trigger-high-cpu.ps1
│   ├── reset-high-cpu.ps1
│   └── rollback-api.ps1
│
├── docker-compose.yml
├── docker-compose.bad-deployment.yml
└── README.md
```

## 3. Technologies Used

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Database driver | pg8000 |
| Containerization | Docker |
| Container orchestration | Docker Compose |
| Monitoring | Prometheus |
| Resource monitoring | cAdvisor |
| Web server / reverse proxy | Nginx |
| Metrics instrumentation | Prometheus Client |

## 4. Prerequisites

Install the following before starting:

- Docker Desktop
- Node.js and npm (only needed for frontend development outside Docker)
- Git
- Visual Studio Code (recommended)

Make sure Docker Desktop is running.

## 5. Starting the Application

Open PowerShell in the `demo-application` directory.

Build and start all services:

```powershell
docker compose up -d --build
```

Check service status:

```powershell
docker compose ps
```

All six services should be running:

1. frontend
2. api
3. database
4. worker
5. prometheus
6. cadvisor

## 6. Application URLs

| Component | URL |
|---|---|
| E-commerce Website | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |
| API Health Check | http://localhost:8000/health |
| Database Readiness | http://localhost:8000/ready |
| Prometheus Metrics | http://localhost:8000/metrics |
| Prometheus Dashboard | http://localhost:9090 |
| Prometheus Targets | http://localhost:9090/targets |
| cAdvisor | http://localhost:8081 |

## 7. API Features

The FastAPI backend provides:

- Product catalogue
- Product details
- Demo login
- Shopping checkout
- Order creation and retrieval
- Health checks
- Database readiness checks
- Prometheus metrics
- Structured JSON logging

### Important API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API information |
| GET | `/health` | Application liveness |
| GET | `/ready` | Database readiness |
| GET | `/metrics` | Prometheus metrics |
| GET | `/products` | List products |
| GET | `/products/{product_id}` | Product details |
| POST | `/login` | Demo login |
| POST | `/checkout` | Create an order |
| GET | `/orders/{order_id}` | Retrieve an order |

## 8. Monitoring

### Prometheus

Prometheus collects application metrics from:

- E-commerce API
- cAdvisor

Open:

http://localhost:9090/targets

Both `ecommerce-api` and `cadvisor` should show **UP**.

### cAdvisor

cAdvisor monitors Docker container resource usage, including:

- CPU usage
- Memory usage
- Container resource consumption

Open:

http://localhost:8081

### Docker logs

View API logs:

```powershell
docker compose logs -f api
```

View database logs:

```powershell
docker compose logs -f database
```

View worker logs:

```powershell
docker compose logs -f worker
```

View all service logs:

```powershell
docker compose logs -f
```

## 9. Failure Scenarios

Sentinel's monitoring and recovery capabilities can be demonstrated using three controlled failure scenarios.

### Scenario 1: Bad Deployment

Simulates an application deployment that causes checkout requests to return HTTP 500 errors.

Trigger:

```powershell
.\failure-scenarios\trigger-bad-deployment.ps1
```

Expected result:
- Checkout requests fail.
- API returns HTTP 500.
- Structured error logs are generated.
- Prometheus records failed requests.

Recovery:

```powershell
.\failure-scenarios\reset-bad-deployment.ps1
```

### Scenario 2: Database Connection Failure

Simulates database unavailability by stopping the PostgreSQL container.

Trigger:

```powershell
.\failure-scenarios\trigger-database-failure.ps1
```

Expected result:
- Database becomes unavailable.
- API readiness check fails.
- Database-related errors appear in API logs.

Recovery:

```powershell
.\failure-scenarios\reset-database-failure.ps1
```

The recovery script waits for PostgreSQL to become healthy.

### Scenario 3: High CPU Consumption

Starts a controlled CPU-intensive Docker container to simulate resource exhaustion.

Trigger:

```powershell
.\failure-scenarios\trigger-high-cpu.ps1
```

Expected result:
- CPU consumption increases.
- cAdvisor exposes container resource metrics.
- Prometheus can collect resource usage information.

Recovery:

```powershell
.\failure-scenarios\reset-high-cpu.ps1
```

This stops the CPU stress container.

## 10. Known-Good API Rollback

A known-good API image is maintained for rollback demonstrations.

Image tag:

```text
sentinel-ecommerce-api:known-good
```

Restore the known-good API version:

```powershell
.\failure-scenarios\rollback-api.ps1
```

Verify the API:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

The rollback script restores the tagged API image and recreates the API container.

Note: The known-good image must exist locally before rollback can work.

## 11. Stopping the Application

Stop all services:

```powershell
docker compose down
```

This stops and removes containers while preserving named volumes and database data.

To remove the database and monitoring data volumes as well:

```powershell
docker compose down -v
```

**Warning:** The second command permanently deletes the stored database and Prometheus volume data.

## 12. Demo Login

Demo credentials:

```text
Email: admin@example.com
Password: sentinel123
```

These credentials are for demonstration purposes only.

## 13. Important Notes

- This is a hackathon demonstration application, not a production-ready e-commerce system.
- Checkout creates database orders but does not process real payments.
- The worker periodically checks database connectivity; it is not a full asynchronous job-processing queue.
- The high-CPU scenario uses a separate controlled stress container.
- The demo login is not intended for production authentication.
- Sentinel's monitoring and recovery demonstrations should be performed in an isolated demo environment.

## 14. Expected Outcome

The completed demo application provides a cloud-native environment where Sentinel can observe application behavior, collect logs and metrics, investigate controlled failures, and demonstrate recovery workflows.

The application provides a realistic target environment for demonstrating Sentinel's incident investigation and remediation capabilities.
## Subdirectories
- `api/`: Sample Python/Node HTTP REST service instrumented with Prometheus metrics.
- `worker/`: Background worker handling asynchronous tasks.
- `database/`: Postgres / Redis schema and seed scripts.
- `failure-scenarios/`:
  - `bad-deployment/`: Simulates a broken rollout returning 500 status codes.
  - `database-failure/`: Terminates the database or severs network connectivity.
  - `resource-exhaustion/`: Allocates unbounded memory to simulate OOM conditions.

