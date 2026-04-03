# Quickstart Guide: Phase 7 Local Validation

## 1. Prerequisites

- Docker Desktop or Docker Engine installed (`docker-compose` v2+).
- Bash-compatible terminal (Git Bash or WSL for Windows users).
- Standard Java 17 and Node.js environments (only required if circumventing docker builds directly).

## 2. Bootstrapping Offline Infrastructure

Navigate to the project root directory where the `docker-compose.yml` is located:

```bash
docker-compose up -d --build
```
Wait a few moments for the database migrations to run and the 5 Spring Boot APIs to stabilize their connection to the LocalStack instance.

## 3. Emulating AWS Mock Topologies

Once `docker-compose` signals all systems are healthy, initialize the dummy AWS endpoints (S3, SES, SNS -> SQS):

```bash
bash ./scripts/init-localstack.sh
```

## 4. Demonstrating the E2E Workflow

Instead of launching a manual Postman request, execute the comprehensive API tester script which rigorously touches every layer of the system:

```bash
bash ./scripts/test-apis.sh
```
Check your backend logs to witness the event flow seamlessly transition from User Creation -> SNS Broadcast -> SQS Ingestion -> SES mailer logs!
