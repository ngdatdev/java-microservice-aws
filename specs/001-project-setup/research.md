# Research: Project Structure & Local Dev Setup

## Decisions & Rationale

### 1. Monorepo Management Strategy
- **Decision**: Independent Maven projects for each service.
- **Rationale**: Each service is a deployable unit with its own lifecycle. Keeping them as independent projects simplifies the CI/CD pipeline and local build isolation. 
- **Alternatives considered**: Maven Multi-module project (rejected for this demo to avoid complex parent POM dependency management).

### 2. Local AWS Simulation
- **Decision**: LocalStack Community Edition (v3.x).
- **Rationale**: Standard tool for AWS simulation. Supports S3, SES, SNS, and SQS locally.
- **Initialization**: Use localstack-init scripts (shell) to create buckets, topics, and queues on startup.

### 3. Database Isolation
- **Decision**: Single PostgreSQL 15 container with 5 logical databases.
- **Rationale**: Efficient resource usage. Each service has its own DB for true isolation, following microservice pattern.
- **Initialization**: A custom entrypoint script for the postgres container will be used to create all 5 databases on first run.

## Best Practices

### Spring Boot in Docker
- Use multi-stage builds (Eclipse Temurin 17 JRE-Alpine) to minimize image size (~150MB).
- Use `JAVA_OPTS` to set memory limits.

### AWS CDK Monorepo
- The `infra/` folder contains a single CDK application with multiple stacks (VPC, ECS, RDS).
- Shared CDK constructs for common patterns (e.g., standard Fargate service with health check).

## Patterns Found
- **Env Template**: Use `.env.example` to track all required variables, with a simple bash script or instructions for developers to copy it to `.env`.
- **Health Checks**: Standardize on `/health` for all Java services and use Docker Compose `healthcheck` to ensure the correct startup order (DB -> Services).
