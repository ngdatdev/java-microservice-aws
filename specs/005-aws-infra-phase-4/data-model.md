# Data Model: AWS Infrastructure (Phase 4)

**Status**: Defined | **Feature**: 005-aws-infra-phase-4

## Infrastructure Entities

### 1. Networking (VPC)
- **VPC**: 10.0.0.0/16, ap-southeast-1, 2 AZs.
- **Subnets**: Public (NAT only), Private (ECS, RDS).
- **Security Groups**:
  - `ecsSg`: Service ports from `nlbSg`.
  - `rdsSg`: PostgreSQL (5432) from `ecsSg`.
  - `nlbSg`: TCP traffic from API Gateway VPC Link.

### 2. Persistence (RDS)
- **Engine**: PostgreSQL 15.4.
- **Instance**: db.t3.micro.
- **Secrets**: AWS Secrets Manager (`/aws-micro-demo/dev/rds-credentials`).
- **Backup**: 1-day retention, Storage Encrypted.

### 3. Compute (ECS Fargate)
- **Cluster**: aws-micro-demo-dev (Container Insights enabled).
- **Service Definitions**:
  - `member-service`: Port 8081.
  - `file-service`: Port 8082.
  - `mail-service`: Port 8083.
  - `auth-service`: Port 8084.
  - `master-service`: Port 8085.
- **Resources**: CPU 256, Memory 512.

### 4. Messaging (SNS-SQS)
- **Topics**: `MemberEventsTopic`, `FileEventsTopic`, `NotificationsTopic`.
- **Queues**: `MailServiceQueue`, `FileProcessingQueue`, `MemberEventQueue`.
- **Subscriptions**:
  - `MemberEvents` (MEMBER_CREATED) -> `MailServiceQueue`.
  - `FileEvents` (FILE_UPLOADED) -> `MailServiceQueue`.

### 5. API Gateway & Delivery
- **API Gateway**: HTTP API (v2) with JWT Authorizer (Cognito).
- **VPC Link**: Integration to internal NLB.
- **CloudFront**: Distribution with OAC for S3 frontend assets.

## Resource Ownership & Relationships
- **VPC Stack**: Provides foundational networking exported to all other stacks.
- **SnsSqsStack**: Managed independently to decouple communication.
- **EcsStack**: Higher-level stack dependent on VPC, ECR, RDS, and Messaging.
