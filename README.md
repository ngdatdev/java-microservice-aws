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
