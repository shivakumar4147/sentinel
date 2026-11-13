# Sentinel AI – Intelligent Incident Detection & Remediation Platform

Sentinel is an AI-assisted incident response and remediation platform designed to detect application failures, investigate their root causes, generate potential fixes, and support controlled recovery through human approval.

The project aims to reduce manual debugging effort while maintaining transparency, safety, and human control over production changes.

## Table of Contents

- [Overview](#overview)
- [Objectives](#objectives)
- [System Architecture](#system-architecture)
- [Incident Remediation Workflow](#incident-remediation-workflow)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Services and Ports](#services-and-ports)
- [Getting Started](#getting-started)
- [Demonstration](#demonstration)
- [Safety and Human Approval](#safety-and-human-approval)
- [Future Enhancements](#future-enhancements)
- [Disclaimer](#disclaimer)

## Overview

Modern applications can experience failures caused by deployment issues, API errors, database problems, configuration changes, or infrastructure failures.

Diagnosing these issues manually requires developers to inspect logs, identify the root cause, develop a solution, apply changes, and verify recovery.

Sentinel aims to automate and assist this process using AI-driven investigation and controlled remediation.

The system combines monitoring, incident management, AI-based analysis, remediation generation, approval workflows, and recovery verification into a centralized platform.

## Objectives

- Detect application failures and operational incidents.
- Collect relevant logs and diagnostic evidence.
- Analyze incidents using AI models.
- Identify probable root causes.
- Generate proposed remediation changes.
- Present remediation proposals for human review.
- Execute approved remediation actions.
- Verify whether the application has recovered.
- Maintain incident history and remediation audit records.
- Prevent unauthorized or unapproved changes.

## System Architecture

Sentinel follows a modular architecture consisting of monitoring, backend orchestration, AI analysis, remediation execution, persistent storage, and an operator dashboard.

### Architecture Components

**1. Monitoring and Application Layer**

The target application is monitored for operational failures and service health.

Monitoring sources include:

- Application/API responses
- HTTP errors
- Container status
- Application logs
- Prometheus metrics

A demonstration ecommerce application is used to simulate application failures and test incident response workflows.

**2. Sentinel Backend – Control Plane**

The backend coordinates incident management and remediation workflows.

Responsibilities include:

- Incident creation and management
- Incident identification and correlation
- Evidence collection
- Workflow orchestration
- Communication with the AI Engine
- Approval management
- Remediation execution coordination
- Recovery verification
- Incident and audit record management

**3. Sentinel AI Engine**

The AI Engine provides intelligent investigation and remediation assistance.

Responsibilities include:

- Incident analysis
- Log and evidence interpretation
- Root cause investigation
- Source code inspection
- Remediation proposal generation
- Patch and diff generation
- Suggested validation tests

The AI Engine is designed to support different model providers through a model-routing architecture.

Supported model approaches include:

- Ollama for locally hosted models
- Groq API for cloud-based inference

**4. Human Approval and Safety Layer**

The platform incorporates a human approval mechanism before remediation execution.

Operators can review proposed changes and:

- Approve a remediation
- Reject a remediation
- Provide additional instructions or feedback

Only authorized and approved remediation actions should proceed to execution.

**5. Remediation Executor**

The remediation executor is responsible for applying approved changes.

Its intended responsibilities include:

- Applying approved patches
- Executing authorized remediation actions
- Recording execution results
- Running validation checks
- Supporting recovery verification
- Reporting failures during execution

**6. Database and Audit Layer**

PostgreSQL provides persistent storage for platform data.

The database is intended to store:

- Incident records
- Incident evidence and findings
- Remediation proposals
- Approval decisions
- Execution results
- Recovery status
- Audit records

**7. Sentinel Dashboard**

The dashboard provides a centralized interface for operators.

It is intended to display:

- Incident information
- Incident severity and status
- Diagnostic evidence
- AI-generated findings
- Proposed remediation changes
- Patch review information
- Approval and rejection controls
- Execution status
- Recovery verification results
- Incident history

## Incident Remediation Workflow

The intended incident response workflow is:

```text
Application Failure
        |
        v
Incident Detection
        |
        v
Incident Creation
        |
        v
Evidence Collection
        |
        v
AI Investigation
        |
        v
Root Cause Analysis
        |
        v
Remediation Proposal
        |
        v
Human Review
        |
   +----+----+
   |         |
Approve    Reject
   |         |
   v         v
Execute    Record
Fix        Decision
   |
   v
Validation & Recovery Check
   |
   v
Incident Resolution
   |
   v
Audit Record
```

### Workflow Description

1. **Detection:** An application failure or operational issue is identified.
2. **Incident Management:** Sentinel creates or associates the event with an incident.
3. **Evidence Collection:** Logs, metrics, application responses, and other diagnostic information are collected.
4. **AI Investigation:** The AI Engine analyzes the collected evidence.
5. **Root Cause Analysis:** The system identifies a probable cause and explains its reasoning.
6. **Remediation Generation:** A proposed solution or source code patch is generated.
7. **Human Approval:** An operator reviews the proposed change and decides whether it should be executed.
8. **Execution:** Approved remediation is passed to the executor.
9. **Validation:** Tests and health checks are performed to evaluate recovery.
10. **Audit:** The incident, decision, execution, and recovery results are recorded.

Rejected remediation proposals must not be executed.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Backend API | Python, FastAPI |
| AI Engine | Python, FastAPI |
| Local AI | Ollama |
| Cloud AI | Groq API |
| Database | PostgreSQL |
| Monitoring | Prometheus |
| Containerization | Docker, Docker Compose |
| Demo Application | React, Python API |
| Version Control | Git, GitHub |

## Project Structure

The repository is organized around the major platform components.

```text
sentinel/
│
├── backend/
│   └── Sentinel backend and incident orchestration
│
├── ai-engine/
│   └── AI investigation and remediation services
│
├── dashboard/
│   └── Sentinel operator dashboard
│
├── demo-application/
│   └── Demonstration ecommerce application
│
├── docs/
│   └── Architecture and project documentation
│
├── docker-compose.yml
├── start_all.ps1
├── README.md
└── requirements.txt
```

*Directory names may vary according to the repository's actual organization.*

## Services and Ports

The following ports are used in the development environment.

| Service | Port |
|---|---:|
| Sentinel Backend | 8000 |
| Sentinel AI Engine | 8001 |
| Sentinel Dashboard | 3000 |
| Demo Storefront | 5173 |
| Ecommerce API | 5001 |
| Prometheus | 9090 |
| Ollama | 11434 |
| Sentinel PostgreSQL | 5432 |
| Ecommerce PostgreSQL | 5433 |

## Getting Started

### Prerequisites

Install the following:

- Git
- Python
- Node.js and npm
- Docker Desktop
- Docker Compose

Ollama is required for local AI inference.

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/sentinel.git
cd sentinel
```

### Start Infrastructure

Start the required infrastructure containers:

```powershell
docker compose up -d postgres ollama prometheus
```

### Start Sentinel Services

Run the project startup script:

```powershell
.\start_all.ps1
```

This starts the local backend, AI Engine, dashboard, and demonstration storefront.

### Access the Platform

- Dashboard: http://localhost:3000
- Backend API Documentation: http://localhost:8000/docs
- AI Engine API Documentation: http://localhost:8001/docs
- Ecommerce API Documentation: http://localhost:5001/docs
- Prometheus: http://localhost:9090

*Startup instructions may require additional configuration depending on the development environment.*

## Demonstration

Sentinel includes a demonstration ecommerce application to simulate application failures and evaluate the incident response process.

### Trigger a Simulated Failure

From the demo application directory:

```powershell
cd demo-application
.\failure-scenarios\trigger-bad-deployment.ps1
```

This activates a simulated checkout failure.

### Test the Checkout API

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:5001/checkout" `
  -ContentType "application/json" `
  -Body '{"product_id":101,"quantity":1,"user_email":"demo@example.com"}'
```

The simulated failure should produce an HTTP 500 response.

### Reset the Demonstration

```powershell
.\failure-scenarios\reset-bad-deployment.ps1
docker restart sentinel-ecommerce-api
```

After resetting, the checkout API can be tested again to verify its normal behavior.

The demonstration is intended to provide a controlled environment for testing incident detection, AI investigation, remediation proposals, approval, and recovery.

## Safety and Human Approval

Sentinel is designed around controlled remediation rather than unrestricted autonomous modification.

Important safety principles:

- AI-generated fixes are proposals, not automatically trusted changes.
- Remediation should require explicit human approval.
- Rejected proposals must not be executed.
- Execution results should be recorded.
- Recovery must be verified independently.
- Failed remediation should be reported rather than silently marked successful.
- Incident and remediation actions should be auditable.

## Future Enhancements

Planned development areas include:

- Improved incident correlation and deduplication
- Automated evidence collection
- Enhanced root cause analysis
- Source-grounded patch generation
- Human-in-the-loop remediation workflows
- Approval-aware execution controls
- Automated test generation and execution
- Recovery verification and rollback support
- PostgreSQL-based incident persistence
- Improved dashboard visualization
- Multi-model AI routing
- Integration with additional monitoring systems
- Enhanced security and execution policies

## Disclaimer

Sentinel is a development and research project focused on AI-assisted incident response and controlled remediation.

The architecture and workflow described in this documentation represent the project's intended design. Individual components and end-to-end capabilities may be under development or require further validation.

AI-generated remediation must be reviewed and validated before being applied to production systems.

