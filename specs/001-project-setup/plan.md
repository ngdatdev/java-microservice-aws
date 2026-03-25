# Implementation Plan: Project Structure & Local Dev Setup

**Branch**: `001-project-setup` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-project-setup/spec.md`

## Summary

Initial monorepo foundation for the AWS Microservice Demo. The technical approach involves creating a standardized directory structure for 5 Java microservices, an AWS CDK infrastructure project, and a Next.js frontend. Local development is orchestrated via Docker Compose, using LocalStack to mock AWS services (S3, SES, SNS, SQS) and PostgreSQL for persistence.

## Technical Context

- **Language/Version**: Java 17 (Backend), TypeScript (CDK & Frontend)
- **Primary Dependencies**: Spring Boot 3.x, Maven, Next.js 14, AWS CDK v2, Docker Compose, LocalStack
- **Storage**: PostgreSQL 15 (5 logical databases)
- **Testing**: JUnit 5, Spring Boot Test
- **Target Platform**: AWS (ECS Fargate, RDS, S3, Cognito)
- **Project Type**: Monorepo Microservices
- **Performance Goals**: N/A (Demo project)
- **Constraints**: Local development must be offline-capable and cost-free via LocalStack simulation.
- **Scale/Scope**: 5 Microservices + 1 Frontend + 1 IaC Project.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Demo-First)**: Plan focuses on infrastructure scaffolding and local simulation. [PASS]
- **Principle II (Minimal Logic)**: Phase 1 is purely structural, no business logic included. [PASS]
- **Principle III (Tech Stack)**: Java 17/Spring Boot 3 (Services), Next.js 14 (Frontend), AWS CDK (Infra). [PASS]
- **Principle IV (Observability/Ports)**: Standardization applied (8081-8085). Health checks included in Compose. [PASS]
- **Principle V (Security)**: Cognito/IAM roles mapped in CDK placeholders. Environment variables used for secrets locally. [PASS]

## Project Structure

### Documentation (this feature)

```text
specs/001-project-setup/
├── plan.md              # This file
├── research.md          # Technology decisions for local simulation
├── data-model.md        # Environment variable schema
├── quickstart.md        # Local startup guide
└── tasks.md             # Execution steps (tasks command)
```

### Source Code (Monorepo Root)

```text
aws-micro-demo/
├── infra/                          # AWS CDK (TypeScript)
│   ├── bin/app.ts
│   ├── lib/                        # Individual service stacks
│   ├── package.json
│   └── cdk.json
├── services/
│   ├── member-service/             # Java Spring Boot + Dockerfile
│   ├── file-service/               # Java Spring Boot + Dockerfile
│   ├── mail-service/               # Java Spring Boot + Dockerfile
│   ├── auth-service/               # Java Spring Boot + Dockerfile
│   └── master-service/             # Java Spring Boot + Dockerfile
├── frontend/                       # Next.js 14 (App Router)
├── docker-compose.yml              # Local dev orchestration
├── .env.example                    # Template for all environment variables
└── README.md                       # Root-level setup instructions
```

**Structure Decision**: Monorepo structure chosen to facilitate cross-service testing and unified infrastructure management via CDK.

## Complexity Tracking

> **No violations identified.**
