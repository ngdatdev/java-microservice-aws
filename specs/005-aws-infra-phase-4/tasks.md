# Tasks: AWS Infrastructure (Phase 4)

**Input**: Design documents from `/specs/005-aws-infra-phase-4/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Note**: This task list was generated based on Phase 4 infrastructure requirements using AWS CDK v2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, ...)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic CDK structure

- [x] T001 Initialize CDK project structure in `infra/`
- [x] T002 Configure `infra/package.json` with version 2.120+ dependencies
- [x] T003 [P] Configure `infra/cdk.json` with context defaults and environment tags

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T004 Implement base `VpcStack` class structure in `infra/lib/vpc-stack.ts`
- [x] T005 Implement `SnsSqsStack` for core messaging topics in `infra/lib/sns-sqs-stack.ts`
- [x] T006 [P] Implement `EcrStack` to create repositories for all 5 services in `infra/lib/ecr-stack.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Core Networking (Priority: P1) 🎯 MVP

**Goal**: Establish the VPC, subnets, and security groups required for all services

**Independent Test**: Run `cdk deploy VpcStack` and verify VPC/Subnets/SGs in AWS Console.

### Implementation for User Story 1

- [x] T007 [US1] Define VPC (10.0.0.0/16) with 2 AZs and NAT Gateway in `infra/lib/vpc-stack.ts`
- [x] T008 [P] [US1] Create security groups (`albSg`, `ecsSg`, `rdsSg`, `nlbSg`) in `infra/lib/vpc-stack.ts`
- [x] T009 [US1] Export VPC and SG metadata using `CfnOutput` in `infra/lib/vpc-stack.ts`

**Checkpoint**: Core networking is functional and testable.

---

## Phase 4: User Story 2 - Managed Persistence (Priority: P1)

**Goal**: Provision RDS PostgreSQL 15.4 with secure credential management

**Independent Test**: Connection test to RDS endpoint from within the VPC.

### Implementation for User Story 2

- [x] T010 [US2] Implement `RdsStack` with version 15.4 in `infra/lib/rds-stack.ts`
- [x] T011 [US2] Configure AWS Secrets Manager for rds-credentials in `infra/lib/rds-stack.ts`
- [x] T012 [US2] Map `rdsSg` to allow inbound traffic from `ecsSg` in `infra/lib/rds-stack.ts`

**Checkpoint**: Database layer is provisioned and secured.

---

## Phase 5: User Story 3 - Container Orchestration (Priority: P2)

**Goal**: Deploy ECS Fargate cluster and services with path-based routing via NLB

**Independent Test**: Access each microservice health check via the NLB DNS.

### Implementation for User Story 3

- [x] T013 [US3] Create ECS Cluster and Cloud Map namespace in `infra/lib/ecs-stack.ts`
- [x] T014 [US3] Define Fargate Task Definitions (CPU 256, MEM 512) in `infra/lib/ecs-stack.ts`
- [x] T016 [US3] Setup internal NLB and Target Groups for API Gateway VPC Link in `infra/lib/ecs-stack.ts`

**Checkpoint**: Microservices are running and reachable via the NLB through API Gateway.

---

## Phase 6: User Story 4 - API Entry & Auth (Priority: P2)

**Goal**: Configure HTTP API Gateway with Cognito JWT Authorization

**Independent Test**: Verify authenticated access to `/api/v1/members` returns 200 with valid token.

### Implementation for User Story 4

- [x] T017 [US4] Implement `CognitoStack` (User Pool & Client) in `infra/lib/cognito-stack.ts`
- [x] T018 [US4] Setup HTTP API Gateway and VPC Link to NLB in `infra/lib/apigateway-nlb-stack.ts`
- [x] T019 [US4] Configure JWT Authorizer and specific route permissions in `infra/lib/apigateway-nlb-stack.ts`

---

## Phase 7: User Story 5 - Edge Delivery & Storage (Priority: P3)

**Goal**: Setup CloudFront with S3 OAC for frontend hosting and media storage

**Independent Test**: Access frontend assets via the CloudFront domain URL.

### Implementation for User Story 5

- [x] T020 [P] [US5] Implement `S3Stack` for storage and frontend buckets in `infra/lib/s3-stack.ts`
- [x] T021 [US5] Setup CloudFront Distribution with OAC for S3 in `infra/lib/cloudfront-stack.ts`
- [x] T022 [US5] Add Cache Policies for static assets and API pass-through in `infra/lib/cloudfront-stack.ts`

---

## Phase 8: User Story 6 - Observability (Priority: P3)

**Goal**: Implement CloudWatch Dashboard and Alarms for system monitoring

**Independent Test**: Verify metrics appear on the dashboard and test alarm triggers.

### Implementation for User Story 6

- [x] T023 [US6] Implement `CloudWatchStack` for Dashboards and Metrics in `infra/lib/cloudwatch-stack.ts`
- [x] T024 [US6] Setup Alarms for CPU utilization (>80%) and 5xx errors (>10) in `infra/lib/cloudwatch-stack.ts`
- [x] T025 [P] [US6] Configure SNS Notification Topic for Alarms in `infra/lib/cloudwatch-stack.ts`

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and final orchestration

- [x] T026 Orchestrate stack dependencies in `infra/bin/app.ts`
- [x] T027 [P] Update `infra/quickstart.md` with final deployment IDs
- [x] T028 Run final `cdk synth` validation across all environments

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Must be completed first.
- **Foundational (Phase 2)**: Blocks all User Story implementation.
- **User Stories (Phase 3-8)**: 
  - VPC (US1) must be complete before RDS (US2) and ECS (US3).
  - Cognito (US4) must be complete before API Gateway auth.
  - S3 (US5) must be complete before CloudFront.

### Parallel Opportunities

- VPC, SnsSqs, and Ecr Stacks (T004-T006) can be built in parallel.
- RdsStack (US2) and EcsStack (US3) can be built in parallel once VPC is ready.
- CloudWatchStack (US6) can be implemented alongside any operational story.

---

## Implementation Strategy

### MVP First (User Story 1-3)

1. Complete Setup and Foundational networking.
2. Deploy VPC, RDS, and ECS (basic connectivity).
3. Validate that services can talk to the database.

### Incremental Delivery

1. Add API Gateway + Cognito (Authentication layer).
2. Add S3 + CloudFront (Static hosting).
3. Add CloudWatch (Monitoring & Alarms).
