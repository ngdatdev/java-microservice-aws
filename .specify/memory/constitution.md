<!-- 
Sync Impact Report:
- Version change: 1.2.0 -> 1.3.0
- List of modified principles: 
    - Tech Stack Consistency: Re-emphasized **Next.js 14 (App Router)** and **shadcn/ui**.
    - Frontend Excellence (NEW): Added Principle VI for component-driven design and RSC vs Client component rules.
- Added sections: None.
- Templates requiring updates: ✅ Updated.
- Follow-up TODOs: Initialize Phase 3 (Frontend) specs and plans.
-->
# AWS Microservice Demo Constitution

## Core Principles

### I. Demo-First Architectures
The primary goal is to provide working demonstrations of various AWS services. Code quality should be high enough for learning, but speed of integration and correct pattern usage take precedence over production-grade optimizations (e.g., massive scale handling or complex business logic).

### II. Minimal Business Logic
Functionality should remain simple. The complexity of the project should reside in the Infrastructure as Code (IaC) and the integration between services (SNS, SQS, SES, S3) rather than deep domain logic. Focus on "How to connect A to B" on AWS.

### III. Tech Stack Consistency
All microservices MUST use **Java 21** and **Spring Boot 3.2.x** with Maven. The frontend MUST use **Next.js 14** with the App Router, TypeScript, and Tailwind CSS. Infrastructure MUST be managed using **AWS CDK v2 (TypeScript)**.

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

## AWS Infrastructure Constraints

The solution must be strictly serverless or managed:
- **Compute**: ECS Fargate is mandatory.
- **Database**: Amazon RDS PostgreSQL (db.t3.micro).
- **Network**: VPC with public/private subnets. API Gateway + internal NLB + CloudFront for edge delivery.
- **Messaging**: SNS for broadcasting, SQS for decoupling.
- **IaC Verification**: Local development MUST use **LocalStack** and **cdklocal** to verify CDK stacks without cloud costs.

## Development Workflow

The project is structured as a monorepo. Local development MUST be supported via **Docker Compose**, utilizing **LocalStack** to mock AWS services (S3, SES, SNS, SQS, Cognito, RDS) to avoid cloud costs. A `.env.example` must be maintained at the root.

## Governance

This constitution governs all architectural decisions. Any deviation must be documented.
**Version**: 1.3.0 | **Ratified**: 2026-03-25 | **Last Amended**: 2026-03-25
