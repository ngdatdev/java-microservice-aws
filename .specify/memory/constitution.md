<!-- 
Sync Impact Report:
- Version change: 1.4.1 -> 1.5.0
- List of modified principles: 
    - Verification & Local Parity (NEW): Promoted local development workflow guidelines into a strict Principle VIII, mandating an exact 8-container local architecture, automated resource initialization (`init-localstack.sh`), and standard testing scripts per Phase 7 specifications.
- Added sections: None.
- Templates requiring updates: ✅ Verified.
- Follow-up TODOs: None.
-->
# AWS Microservice Demo Constitution

## Core Principles

### I. Demo-First Architectures
The primary goal is to provide working demonstrations of various AWS services. Code quality should be high enough for learning, but speed of integration and correct pattern usage take precedence over production-grade optimizations (e.g., massive scale handling or complex business logic).

### II. Minimal Business Logic
Functionality should remain simple. The complexity of the project should reside in the Infrastructure as Code (IaC) and the integration between services (SNS, SQS, SES, S3) rather than deep domain logic. Focus on "How to connect A to B" on AWS.

### III. Tech Stack Consistency
All microservices MUST use **Java 17** and **Spring Boot 3.x** with Maven. The frontend MUST use **Next.js 14** with the App Router, TypeScript, and Tailwind CSS. Infrastructure MUST be managed using **AWS CDK (TypeScript)**.

### IV. Observability & Port Standardization
Every service MUST implement health check endpoints (`/health`) and stream logs to Amazon CloudWatch. 
- **Port Mapping**: Member (8081), File (8082), Mail (8083), Master (8084), Auth (8085).
- **Frontend**: Port 3000.

### V. Security via Managed Services
Offload security responsibilities to AWS managed services:
- **Auth**: Amazon Cognito.
- **Secrets**: AWS Secrets Manager (for DB credentials).
- **Permissions**: IAM roles with the **Principle of Least Privilege**.

### VI. Frontend Excellence
The frontend MUST follow modern React/Next.js best practices:
- **Component System**: Use **shadcn/ui** for high-quality, accessible UI components.
- **Patterns**: Leverage **React Server Components (RSC)** for data fetching and **Client Components** only for interactivity.
- **API Client**: Maintain a unified fetch wrapper with standardized error handling and type-safe DTOs.
- **Styling**: **Tailwind CSS** is mandatory for all layouts and components.

### VII. IaC Deployment & Environment Rigor
Infrastructure MUST be provisioned systematically:
- **Stack Ordering**: Stacks MUST follow strict dependency ordering (Networking -> Storage/Data -> Auth -> Messaging -> Compute -> Edge -> CI/CD) to prevent circular dependencies.
- **Environment Parity**: The CDK app MUST support context-driven environments (e.g., `dev`, `staging`, `prod`) configured via `cdk.json`.
- **Universal Tagging**: All resources MUST consistently receive standard tags (`Project`, `Environment`, `ManagedBy: CDK`).

### VIII. Verification & Local Parity
Local environments MUST tightly mimic production:
- **Container Synchronization**: A unified `docker-compose.yml` MUST define exactly 8 orchestrated containers (`postgres`, `localstack`, 5 spring boot services, and 1 frontend).
- **Mocking Strategy**: `LocalStack` MUST be used to mock S3, SNS, SQS, and SES locally to bypass cloud costs.
- **Scripted Verification**: Local operations MUST be verifiable via automated scripts (`scripts/init-localstack.sh` and `scripts/test-apis.sh`).
- **Demo Viability**: Every layer of the system MUST be documented iteratively via a `ARCHITECTURE.md` and user-friendly `DEMO-GUIDE.md`.

## AWS Infrastructure Constraints

The solution must be strictly serverless or managed:
- **Compute**: ECS Fargate is mandatory.
- **Database**: Amazon RDS PostgreSQL (db.t3.micro).
- **Network**: VPC with public/private subnets. API Gateway + internal NLB + CloudFront for edge delivery.
- **Messaging**: SNS for broadcasting, SQS for decoupling.
- **CI/CD**: GitHub Actions.
- **IaC Verification**: Local development MUST use **LocalStack** and **cdklocal** to verify CDK stacks without cloud costs.

## Development Workflow

The project is structured as a monorepo. A `.env.example` must be maintained at the root. Prior to cloud deployment, the system must be entirely bootable offline using the unified Docker architecture specified in Principle VIII.

## Governance

This constitution governs all architectural decisions. Any deviation must be documented.
**Version**: 1.5.0 | **Ratified**: 2026-03-25 | **Last Amended**: 2026-04-03
