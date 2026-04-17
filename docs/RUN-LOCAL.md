# Run Locally Guide

This guide describes how to run the services and the frontend in your local development environment using **Docker for PostgreSQL** and **Real AWS Services** (Dev/Staging).

## 1. Prerequisites

Ensure you have the following installed:
- **Java 17**: Required for backend services (Spring Boot).
- **Node.js 18+**: Required for the frontend (Next.js) and root scripts.
- **Docker & Docker Compose**: For running the database or the full stack.
- **AWS CLI**: For authenticating with real AWS services.

---

## 2. Configuration (.env)

Everything depends on having a correctly configured `.env` file in the project root.

1.  **Copy the template**:
    ```bash
    cp .env.example .env
    ```
2.  **Authenticate with AWS**:
    - **Option A (SSO)**: Run `aws sso login --profile aws-dev`. (Note: For Docker Compose, you must use Option B below).
    - **Option B (Keys)**: Fill in `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in your `.env`.
3.  **Fill in Resource IDs**: Add the real ARNs and IDs for Cognito, S3, SNS, and SQS as provided by your CDK deployment.

---

## 3. Option A: Development Mode (Recommended for Coding)

This method is best for active development as it allows for fast restarts and easy debugging in your IDE.

### Step 1: Start Database
```bash
npm run dev:postgres
```

### Step 2: Run Microservices
Open a separate terminal for each service and run the corresponding command from the root:
- `npm run dev:auth` (Port 8084)
- `npm run dev:member` (Port 8081)
- `npm run dev:file` (Port 8082)
- `npm run dev:mail` (Port 8083)
- `npm run dev:master` (Port 8085)

### Step 3: Run Frontend
```bash
npm run dev:frontend
```

---

## 4. Option B: Full Stack via Docker Compose

This method runs the entire system (DB + 5 Services + Frontend) inside Docker containers. It is useful for testing the system as a whole.

### Step 1: Prepare Environment
Ensure your `.env` file contains valid **AWS Access Keys** (SSO login is not natively supported inside the standard Docker containers without extra volume mounting).

### Step 2: Launch Stack
```bash
docker-compose up -d --build
```

### Step 3: Verify
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Entry (Master)**: [http://localhost:8085](http://localhost:8085)
- **Individual Services**: Reachable on ports 8081-8084.

---

## 5. Ports Summary

| Service | Local Port | Docker Port |
|---------|------------|-------------|
| Frontend | 3000 | 3000 |
| Master Service | 8085 | 8085 (Mapped from 8080) |
| Auth Service | 8084 | 8084 (Mapped from 8080) |
| Mail Service | 8083 | 8083 (Mapped from 8080) |
| File Service | 8082 | 8082 (Mapped from 8080) |
| Member Service | 8081 | 8081 (Mapped from 8080) |
| PostgreSQL | 5432 | 5432 |

---

## 6. Troubleshooting

- **Access Denied**: Verify your `AWS_ACCESS_KEY_ID` has permissions for the resources in `.env`.
- **Port Conflicts**: Ensure ports 3000, 5432, and 8081-8085 are free.
- **Docker Networking**: If running via Docker Compose, services communicate via the internal network (e.g., `http://postgres:5432`). This is handled automatically by the `env_file: .env` configuration.
