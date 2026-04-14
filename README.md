# AWS Microservice Demo

This is a demonstration project showcasing a microservice architecture deployed on AWS using ECS Fargate, RDS, S3, Cognito, and SNS/SQS.

## Project Structure

- `infra/`: AWS CDK (TypeScript) for cloud infrastructure.
- `services/`: 5 Spring Boot 3.x microservices (Java 17).
- `frontend/`: Next.js 14 application.
- `scripts/`: Initialization scripts for local development.

## Local Development (Docker)

### Prerequisites
- Docker Desktop
- Node.js 20+
- Java 17

### Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Build and start the environment:
   ```bash
   docker-compose up --build -d
   ```

### Access Points
- **Member Service**: http://localhost:8081
- **File Service**: http://localhost:8082
- **Mail Service**: http://localhost:8083
- **Auth Service**: http://localhost:8084
- **Master Service**: http://localhost:8085
- **Frontend**: http://localhost:3000
- **LocalStack**: http://localhost:4566

---

## ☁️ Cloud Deployment (AWS)

The project is fully automated via **GitHub Actions**.

### 1. Pre-requisites
- AWS Account with Admin permissions.
- GitHub Secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).

### 2. Manual Configuration
Refer to **[AWS-SETUP-CHECKLIST.md](./docs/AWS-SETUP-CHECKLIST.md)** for mandatory SES and Cognito manual verification steps.

### 3. CI/CD Lifecycle
- **Pull Request**: Triggers code validation (Java/Frontend) and `cdk synth`.
- **Merge to Main**: Triggers automatic Docker push to ECR and `cdk deploy`.

---

## 📚 Documentation
- **[DevOps Master Playbook](./docs/infrastructure/00-MASTER-PLAYBOOK.md)**: The end-to-end guide from zero to production.
- **[System Architecture](./docs/ARCHITECTURE.md)**: Visual map and component boundaries.
- **[Demo Guide](./docs/DEMO-GUIDE.md)**: Step-by-step verification of the ecosystem features.
