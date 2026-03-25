# Feature Specification: AWS CDK Infrastructure for Microservices Demo

**Feature Branch**: `003-aws-cdk-infra`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Implement AWS CDK Infrastructure as Code for the 5 microservices demo, supporting LocalStack and real AWS deployment."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Local Infrastructure Verification (Priority: P1)

Developers need to verify the entire system locally using LocalStack. This ensures that the Member, File, Mail, Auth, and Master services can all interact with their required AWS resources without needing a real AWS account or incurring any costs.

**Why this priority**: Essential for rapid development and testing cycles without external dependencies. This is the foundation for verifying service integration.

**Independent Test**: Can be fully tested by running `cdklocal deploy` and observing the successful creation of SNS, SQS, S3, and Cognito resources in the local Docker environment.

**Acceptance Scenarios**:

1. **Given** LocalStack is running in Docker, **When** `cdklocal deploy` is executed, **Then** all resources defined in the stack are created successfully.
2. **Given** resources are deployed locally, **When** AWS CLI commands (e.g., `aws --endpoint-url=http://localhost:4566 s3 ls`) are run, **Then** the expected resources are visible.

---

### User Story 2 - Cloud Deployment Transition (Priority: P2)

Cloud engineers want to use the same codebase to deploy to a real AWS staging or production environment. The transition should only require environment configuration changes (e.g., region, account ID) rather than code changes.

**Why this priority**: Ensures that the "infrastructure as code" principle is upheld, guaranteeing that what is tested locally is exactly what runs in the cloud.

**Independent Test**: Can be tested by running `cdk synth` and verifying that the generated CloudFormation template is ready for standard AWS deployment.

**Acceptance Scenarios**:

1. **Given** standard AWS credentials, **When** `cdk deploy` is run, **Then** the stack is successfully provisioned on the real AWS account.

---

### User Story 3 - Automated Resource Provisioning (Priority: P3)

The system should be ready for CI/CD integration. Any change to the infrastructure code should be deployable via a pipeline (e.g., GitHub Actions or AWS CodePipeline).

**Why this priority**: Reduces manual effort and prevents configuration drift between environments.

**Independent Test**: Can be tested by running `cdk diff` to see exactly what changes will be applied before a deployment.

**Acceptance Scenarios**:

1. **Given** a change to the CDK stack, **When** `cdk diff` is run, **Then** the output accurately reflects the changes to be made.

### Edge Cases

- What happens when a resource name already exists in LocalStack? (CDK should handle update or throw error).
- How does the system handle LocalStack crashes during deployment? (State should be recoverable).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define a VPC with appropriate subnets for microservice isolation.
- **FR-002**: System MUST provision two pub/sub messaging topics: `member-events` and `file-events`.
- **FR-003**: System MUST provision a message queue named `mail-queue` and subscribe it to the `member-events` topic.
- **FR-004**: System MUST provision a scalable storage bucket named `demo-file-storage` for document storage.
- **FR-005**: System MUST provision a managed identity provider and a corresponding application client for authentication.
- **FR-006**: System MUST support localized resource emulation for all cloud services used in the architecture.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The infrastructure stack MUST synthesize into a valid orchestration template in less than 30 seconds.
- **SC-002**: A local deployment to the emulator MUST complete in less than 2 minutes on standard development machines.
- **SC-003**: 100% of defined resources MUST be verifiable via command-line tools after a successful deployment.
- **SC-004**: Infrastructure definitions MUST remain 100% consistent across different deployment targets (Local vs. Cloud).

## Assumptions

- **Assumption about environment**: Users have Docker and LocalStack installed locally.
- **Assumption about tools**: `aws-cdk-local` (cdklocal) is available in the development environment.
- **Assumption about Java Services**: The 5 microservices are already implemented and ready to connect to these resources once deployed.
- **Dependency**: The infrastructure relies on CDK v2 (TypeScript).
