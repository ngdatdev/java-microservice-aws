# Feature Specification: Project Structure & Local Dev Setup

**Feature Branch**: `001-project-setup`  
**Created**: 2026-03-25  
**Status**: Ready for Planning  
**Input**: User description: "Initial monorepo structure and local development setup with Docker Compose and LocalStack"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Monorepo Foundation (Priority: P1)

As a developer, I want a standardized folder structure for the microservices, infrastructure, and frontend so that the team can work in a unified environment and follow consistent patterns.

**Why this priority**: It is the mandatory starting point for all other phases. Without the structure, we cannot implement services or infrastructure consistently.

**Independent Test**: Can be fully tested by verifying the existence of the expected directory tree and placeholder files.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository, **When** I list the root directory, **Then** I see `infra/`, `services/`, and `frontend/` folders.
2. **Given** the `services/` folder, **When** I list its contents, **Then** I see independent directories for `member-service`, `file-service`, `mail-service`, `auth-service`, and `master-service`.
3. **Given** any directory in `services/`, **When** I check its contents, **Then** I find a standard Maven structure (`pom.xml`, `src/`) and a `Dockerfile`.

---

### User Story 2 - Local Environment Simulation (Priority: P1)

As a developer, I want to run all services and databases locally without needing actual AWS resources so that I can develop, test, and debug rapidly without cloud costs or internet dependency.

**Why this priority**: Critical for developer productivity and local testing before deploying to AWS.

**Independent Test**: Verified by running `docker-compose up` and checking visibility/health of all containers.

**Acceptance Scenarios**:

1. **Given** the `docker-compose.yml` file and a running Docker daemon, **When** I execute `docker-compose up -d`, **Then** 5 microservice containers, 1 PostgreSQL container, and 1 LocalStack container transition to an 'up' state.
2. **Given** the services are running, **When** I curl `http://localhost:[port]/health` for each service, **Then** I receive a 200 OK response with a "UP" status.
3. **Given** the local environment is running, **When** a service attempts to access S3 or SQS, **Then** it successfully connects to the LocalStack container instead of actual AWS.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST follow a monorepo structure: `infra/` (AWS CDK), `services/` (Microservices), and `frontend/` (Next.js).
- **FR-002**: Each of the 5 Java microservices MUST have an independent Maven `pom.xml` and a multi-stage `Dockerfile`.
- **FR-003**: The project MUST include a root-level `docker-compose.yml` orchestrating all components.
- **FR-004**: System MUST include a `localstack` container configured for S3, SES, SNS, and SQS simulation.
- **FR-005**: All services MUST accept configuration via Environment Variables (DB_HOST, S3_BUCKET, etc.).
- **FR-006**: A `.env.example` file MUST be provided containing all required variables for local execution.
- **FR-007**: A `README.md` MUST exist with clear instructions on how to build and start the local environment.

### Key Entities *(include if feature involves data)*

- **Microservice**: Represents an individual deployable unit (Java/Spring Boot).
- **Environment Configuration**: Set of variables required to bridge code with infrastructure (LocalStack or AWS).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new developer can have the entire local environment running (containers started and healthy) in under 10 minutes.
- **SC-002**: 100% of the microservices respond successfully to health check requests on their assigned local ports (8081-8085).
- **SC-003**: All AWS-dependent services (S3, SES, SNS, SQS) are accessible locally through LocalStack without requiring an AWS account or internet access.

## Assumptions

- Developers have Docker Desktop or an equivalent Docker engine installed.
- All 5 microservices will share a single PostgreSQL instance but use 5 separate logical databases.
- Next.js frontend is included in the monorepo but might be developed/run separately from the containerized backend during active development.
- AWS CDK will be used for cloud deployment, but is excluded from the local `docker-compose` flow (LocalStack replaces it).
