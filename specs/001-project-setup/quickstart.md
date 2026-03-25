# Quickstart: AWS Microservice Demo Local Setup

## Prerequisites
- Docker & Docker Compose
- Java 17 + Maven
- Node.js 20+

## Step 1: Clone and Configure
1. Clone the repository.
2. Copy `.env.example` to `.env`.
   ```bash
   cp .env.example .env
   ```

## Step 2: Build Services
Navigate to the root and build all microservices (requires Maven):
```bash
# Example for one service
cd services/member-service
mvn clean package -DskipTests
```

## Step 3: Start Environment & Infrastructure
Run the Docker Compose stack:
```bash
docker-compose up -d
```

Deploy LocalStack AWS Infrastructure using `cdklocal`:
```bash
cd infra
npm install
npx cdklocal bootstrap
npx cdklocal deploy --require-approval never
```
## Step 4: Verify
Check service health via curl or browser:
- Member Service: `http://localhost:8081/health`
- File Service: `http://localhost:8082/health`
- Mail Service: `http://localhost:8083/health`
- Auth Service: `http://localhost:8084/health`
- Master Service: `http://localhost:8085/health`
- Frontend: `http://localhost:3000`

LocalStack Dashboard: `http://localhost:4566/health`
