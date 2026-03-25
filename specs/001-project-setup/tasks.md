# Tasks: Project Structure & Local Dev Setup

## Phase 1: Project Foundation & Infrastructure [P]

- [ ] [P] Initialize `infra/` folder with AWS CDK (TypeScript).
  - [ ] Run `cdk init app --language typescript` in `infra/`.
  - [ ] Create placeholder stack files in `infra/lib/` as defined in Plan.
- [ ] [P] Initialize `frontend/` folder with Next.js 14.
  - [ ] Run `npx create-next-app@latest frontend --typescript --tailwind --eslint`.
- [ ] Create root-level `.env.example` with all variables from `data-model.md`.
- [ ] Create root-level `README.md` with setup instructions from `quickstart.md`.

## Phase 2: Microservices Scaffolding [P]

- [ ] [P] Initialize `member-service`.
  - [ ] Generate Spring Boot 3.x project (Web, JPA, Postgres, Actuator).
  - [ ] Add `Dockerfile` (multi-stage).
  - [ ] Configure `application.yml` for database and AWS ports.
- [ ] [P] Initialize `file-service`.
  - [ ] Generate Spring Boot 3.x project (Web, JPA, Postgres, Actuator).
  - [ ] Add `Dockerfile`.
- [ ] [P] Initialize `mail-service`.
  - [ ] Generate Spring Boot 3.x project (Web, JPA, Postgres, Actuator).
  - [ ] Add `Dockerfile`.
- [ ] [P] Initialize `auth-service`.
  - [ ] Generate Spring Boot 3.x project (Web, JPA, Postgres, Actuator).
  - [ ] Add `Dockerfile`.
- [ ] [P] Initialize `master-service`.
  - [ ] Generate Spring Boot 3.x project (Web, JPA, Postgres, Actuator).
  - [ ] Add `Dockerfile`.

## Phase 3: Local Dev Orchestration

- [ ] Create root-level `docker-compose.yml`.
  - [ ] Configure `postgres:15` with initialization script for 5 databases.
  - [ ] Configure `localstack/localstack` with S3, SES, SNS, SQS.
  - [ ] Configure all 5 microservices with build context and environment variables.
  - [ ] Configure `frontend` with build context.
- [ ] Create `init-db.sql` for PostgreSQL to create the 5 logical databases.
- [ ] Create `localstack-init.sh` to initialize mock AWS resources.

## Phase 4: Verification

- [ ] Execute `docker-compose up -d` and wait for all containers to be healthy.
- [ ] [P] Verify health endpoint for each service (8081-8085).
- [ ] Verify LocalStack accessibility (`awslocal s3 ls`).
- [ ] Verify Frontend accessibility (port 3000).
