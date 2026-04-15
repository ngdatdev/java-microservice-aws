# Implementation Plan: AWS Infrastructure (Phase 4)

**Branch**: `005-aws-infra-phase-4` | **Date**: 2026-03-29 | **Spec**: [spec.md](file:///d:/a_project/aws/specs/005-aws-infra-phase-4/spec.md)
**Input**: Feature specification from `/specs/005-aws-infra-phase-4/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

This feature involves implementing the full AWS infrastructure lifecycle for the demo system. Using AWS CDK v2 (TypeScript), we will provision a multi-tier network (VPC), managed persistence (RDS), container orchestration (ECS Fargate), and an event-driven messaging layer (SNS/SQS). The architecture is designed to be cost-effective for a demo (single NAT GW, t3.micro instances) while demonstrating high-quality integration patterns like VPC Proof of Link, HTTP API Gateway, and CloudFront OAC.

## Technical Context

**Language/Version**: TypeScript 5.x, AWS CDK v2.120+  
**Primary Dependencies**: `aws-cdk-lib`, `constructs`, `jest` (for testing)  
**Storage**: Amazon RDS PostgreSQL 15.4 (one instance with multiple DBs seeded via app)  
**Testing**: CDK Assertions and Snapshot testing via Jest  
**Target Platform**: AWS Cloud (Default region: `ap-southeast-1`)
**Project Type**: Infrastructure as Code (IaC) monorepo component  
**Performance Goals**: Synthesis time < 1 min, Full deployment < 45 mins  
**Constraints**: Single NAT Gateway for cost savings; db.t3.micro for RDS; 256 CPU / 512 MiB RAM for ECS tasks.  
**Scale/Scope**: 11-13 distinct CDK stacks orchestrated through a single entry point.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Demo-First)**: ✅ Plan uses standard AWS patterns optimized for cost (NAT GW x1).
- **Principle III (Tech Stack)**: ✅ Uses AWS CDK v2 (TypeScript) as mandated.
- **Principle IV (Observability)**: ✅ Includes CloudWatch Dashboards and Alarms.
- **Principle V (Security)**: ✅ Uses Cognito for auth, Secrets Manager for RDS, and OAC for CloudFront.
- **Infrastructure Constraints**: ✅ Adheres to ECS Fargate, RDS PostgreSQL, and VPC requirements.

## Project Structure

### Documentation (this feature)

```text
specs/005-aws-infra-phase-4/
├── plan.md              # This file
├── research.md          # Infrastructure design decisions
├── data-model.md        # AWS Resource definitions & relationships
├── quickstart.md        # Deployment instructions
├── contracts/           # API Gateway & NLB routing definitions
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
infra/
├── bin/
│   └── app.ts           # Entry point for all stacks
├── lib/
│   ├── vpc-stack.ts     # Networking
│   ├── rds-stack.ts     # Database
│   ├── ecs-stack.ts     # Container orchestration
│   ├── s3-stack.ts      # Storage
│   └── ...              # Other stacks
├── test/                # Unit tests for stacks
├── package.json
└── cdk.json
```

**Structure Decision**: Infrastructure is centralized in the `infra/` directory using a multi-stack pattern to manage complexity and dependency ordering.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Multiple Stacks | To handle circular dependencies and keep logical separation. | Single stack would be too large and hit CloudFormation resource limits. |
