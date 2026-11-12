# Member 4: Monitoring Setup (Prometheus)

## Overview
This directory configures Prometheus metric scraping and alert evaluation for the Sentinel platform and demo applications.

## Configuration Files
- `prometheus/prometheus.yml`: Scrapes metrics from `sentinel-backend:8000` and `demo-api:5000` at 5-second intervals.
- `prometheus/alerts.yml`: Alert rules triggering on elevated 5xx error rates (>5%) and container downtime.
