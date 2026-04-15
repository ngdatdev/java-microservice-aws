# Feature Specification: AWS Infrastructure (Phase 4)

**Feature Branch**: `005-aws-infra-phase-4`  
**Created**: 2026-03-29  
**Status**: Draft  
**Input**: User description: "Implement AWS Infrastructure (Phase 4)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deploy Core Networking (Priority: P1)

As a Cloud Architect, I want to provision a secure and scalable VPC so that the microservices have a reliable network to communicate within.

**Why this priority**: Essential foundation for all other infrastructure components.

**Independent Test**: Can be verified by running `cdk deploy VpcStack` and checking VPC resources in the AWS Console.

**Acceptance Scenarios**:

1. **Given** a new AWS environment, **When** I deploy the VpcStack, **Then** a VPC with CIDR 10.0.0.0/16 and 2 Availability Zones is created.
2. **Given** the VPC is created, **When** I check subnets, **Then** both Public and Private subnets are present in each AZ.
3. **Given** the networking is up, **When** I check security groups, **Then** `albSg`, `ecsSg`, `rdsSg`, and `nlbSg` are created with correct ingress/egress rules.

---

### User Story 2 - Provision Managed Persistence (Priority: P1)

As a Database Administrator, I want to set up an RDS PostgreSQL instance so that microservices can persist data securely and reliably.

**Why this priority**: All microservices depend on the database for state management.

**Independent Test**: Can be verified by connecting to the RDS endpoint from a bastion host or another service within the VPC.

**Acceptance Scenarios**:

1. **Given** the VpcStack is deployed, **When** I deploy the RdsStack, **Then** an Amazon RDS PostgreSQL 15.4 instance (db.t3.micro) is provisioned in the private subnets.
2. **Given** the RDS instance is up, **When** I check Secrets Manager, **Then** a secret named `/aws-micro-demo/dev/rds-credentials` exists with valid credentials.

---

### User Story 3 - Orchestrate Container Services (Priority: P2)

As a DevOps Engineer, I want to configure ECS Fargate services and ECR repositories so that our 5 microservices can be deployed and scaled automatically.

**Why this priority**: Core compute layer for the application logic.

**Independent Test**: Can be verified by checking service health in the ECS console and accessibility via the NLB through API Gateway.

**Acceptance Scenarios**:

1. **Given** all 5 services have Docker images in ECR, **When** I deploy the EcsStack, **Then** 5 Fargate services are running with 1 task each.
2. **Given** the services are running, **When** traffic hits the NLB on service ports (8081-8085) through API Gateway VPC Link, **Then** it is routed to the correct ECS service.

---

### User Story 4 - Enable Asynchronous Messaging (Priority: P2)

As a Developer, I want to set up SNS and SQS resources so that my microservices can communicate using an event-driven architecture.

**Why this priority**: Enables decoupling and reliable integration between services like `member-service` and `mail-service`.

**Independent Test**: Can be verified by publishing a test message to an SNS topic and checking for its delivery in the subscribed SQS queue.

**Acceptance Scenarios**:

1. **Given** the SnsSqsStack is deployed, **When** a message is sent to `MemberEventsTopic` with event `MEMBER_CREATED`, **Then** it is successfully delivered to the `MailServiceQueue`.

---

### Edge Cases

- **What happens when the NAT Gateway fails?** The system should ideally have HA, but for this demo, a single NAT is accepted; however, private subnet tasks will lose outbound internet access.
- **How does the system handle Secrets Manager rotation?** While rotation isn't mandatory for the demo, the application should be able to fetch updated credentials on restart.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provision a VPC with CIDR 10.0.0.0/16, 2 Availability Zones, and Public/Private subnet pairs.
- **FR-002**: System MUST deploy an Amazon RDS PostgreSQL 15.4 instance using `db.t3.micro` instance class.
- **FR-003**: System MUST create 5 ECR repositories, one for each microservice.
- **FR-004**: System MUST deploy 5 ECS Fargate services with CPU 256 and Memory 512.
- **FR-005**: System MUST configure an HTTP API Gateway with a VPC Link to an internal NLB.
- **FR-006**: System MUST implement a CloudFront distribution with Origin Access Control (OAC) for frontend S3 hosting.
- **FR-007**: System MUST create an SNS-SQS mapping for event-driven communication (e.g., Member Events to Mail Queue).
- **FR-008**: System MUST provision a CloudWatch Dashboard for monitoring service health and performance.

### Key Entities *(include if feature involves data)*

- **Infrastructure Stack**: Represents a unit of deployment (e.g., VPC, RDS, ECS).
- **ECR Repository**: Storage for container images.
- **ECS Task Definition**: Configuration for running microservice containers (CPU, Memory, Roles).
- **SNS Topic**: Pub/Sub channel for system events.
- **SQS Queue**: Buffer for asynchronous message processing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 11 CDK stacks synthesize without errors and pass validation.
- **SC-002**: Deployment time for the entire infrastructure from scratch is under 45 minutes.
- **SC-003**: 100% of microservice health check endpoints are reachable via the API Gateway.
- **SC-004**: CloudWatch Alarms successfully send notifications to a designated SNS topic within 60 seconds of a threshold breach.

## Assumptions

- **LocalStack**: Local development continues to be supported via LocalStack for S3, SNS, SQS, and SES.
- **AWS Regions**: Configuration is optimized for `ap-northeast-1` by default.
- **Cognito**: Sandbox/Local restrictions are accepted during development (fallback to local auth).
- **SES**: Domain/Email verification is assumed to be handled manually as a prerequisite.
