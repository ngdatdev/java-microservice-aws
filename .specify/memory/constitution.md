<!-- 
Sync Impact Report:
- Version change: 1.0.0 -> 1.1.0
- List of modified principles: 
    - Tech Stack Consistency (added Tailwind CSS and explicitly named Next.js 14).
    - Observability (added port ranges 8081-8085).
    - Security (explicitly named IAM least privilege).
- Added sections: Detailed Service Mapping (SES, SQS, SNS, CloudFront).
- Templates requiring updates: ✅ All updated.
- Follow-up TODOs: Ensure Docker Compose health checks match port assignments.
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
- **Port Mapping**: Member (8081), File (8082), Mail (8083), Auth (8084), Master (8085).
- **Frontend**: Port 3000.

### V. Security via Managed Services
Offload security responsibilities to AWS managed services:
- **Auth**: Amazon Cognito.
- **Secrets**: AWS Secrets Manager (for DB credentials).
- **Permissions**: IAM roles with the **Principle of Least Privilege**.

## AWS Infrastructure Constraints

The solution must be strictly serverless or managed:
- **Compute**: ECS Fargate is mandatory.
- **Database**: Amazon RDS PostgreSQL (db.t3.micro).
- **Network**: VPC with public/private subnets. API Gateway + internal NLB + CloudFront for edge delivery.
- **Messaging**: SNS for broadcasting, SQS for decoupling.
- **DevOps**: CodeCommit + CodeBuild + CodePipeline for CI/CD.

## Development Workflow

The project is structured as a monorepo. Local development MUST be supported via **Docker Compose**, utilizing **LocalStack** to mock AWS services (S3, SES, SNS, SQS) to avoid cloud costs. A `.env.example` must be maintained at the root.

## Governance

This constitution governs all architectural decisions. Any deviation must be documented.
**Version**: 1.1.0 | **Ratified**: 2026-03-25 | **Last Amended**: 2026-03-25
