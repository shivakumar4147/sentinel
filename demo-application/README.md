# Member 4: Target Demo Application & Failure Scenarios

## Overview
This directory contains a sample multi-tier application used to demonstrate Sentinel's autonomous monitoring, detection, investigation, and recovery capabilities.

## Subdirectories
- `api/`: Sample Python/Node HTTP REST service instrumented with Prometheus metrics.
- `worker/`: Background worker handling asynchronous tasks.
- `database/`: Postgres / Redis schema and seed scripts.
- `failure-scenarios/`:
  - `bad-deployment/`: Simulates a broken rollout returning 500 status codes.
  - `database-failure/`: Terminates the database or severs network connectivity.
  - `resource-exhaustion/`: Allocates unbounded memory to simulate OOM conditions.
