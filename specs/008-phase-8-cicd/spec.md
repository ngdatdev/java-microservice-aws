# Feature Specification: Phase 8 CI/CD Automated Deployment & Ops Checklist

**Feature Branch**: `008-phase-8-cicd`  
**Created**: 2026-04-03  
**Status**: Draft  
**Input**: User description: "Phase 8: CI/CD Automated Deployment and AWS Services Configuration Checklist"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automated Multi-Service Deployment (Priority: P1)

As a developer, I want my code changes to be automatically built, containerized, and deployed to AWS on every push to `main`, so that I don't have to manage manual script executions or Docker push commands.

**Why this priority**: This is the core requirement for "Continuous Delivery" in a microservice architecture. It eliminates manual errors and ensures the cloud environment always reflects the latest stable code.

**Independent Test**: Can be fully tested by pushing a change to the `main` branch and verifying that the GitHub Action completes all 3 jobs (Verify, Build/Push, Deploy) successfully.

**Acceptance Scenarios**:

1. **Given** a valid commit is pushed to the `main` branch, **When** the workflow triggers, **Then** 5 Docker images are pushed to ECR and `cdk deploy` updates the cloud resources.
2. **Given** the deployment completes, **When** I check the ECS console, **Then** I see 5 running tasks tagged with the latest Git SHA.

---

### User Story 2 - PR Build & Infrastructure Validation (Priority: P2)

As a reviewer, I want every Pull Request to be automatically validated (compiled and CDK synthesized) so that I can be confident the changes won't break the build or the infrastructure graph before they are merged.

**Why this priority**: Prevents "broken main" syndrome and ensures infrastructure changes are valid before they impact the shared environment.

**Independent Test**: Can be tested by opening a Pull Request with a syntax error or a circular CDK dependency and verifying that the workflow fails.

**Acceptance Scenarios**:

1. **Given** a Pull Request is opened, **When** the CI job runs, **Then** it must successfully run Maven package for all services and `cdk synth` for the infra.
2. **Given** a failing build in a PR, **When** the workflow finishes, **Then** the merge button should be blocked by a failed status check.

---

### User Story 3 - Comprehensive Operational Checklist (Priority: P3)

As an administrator, I want a clear guide for manual AWS service setups and troubleshooting common cloud errors so that I can maintain system health beyond the automated pipeline.

**Why this priority**: Necessary for the "Zero to Production" journey where some AWS services (like SES identities or Cognito Client IDs) require out-of-band manual verification or post-deployment tweaks.

**Independent Test**: Verified by following the checklist from a clean AWS account and successfully reaching a "Deployment Successful" state.

**Acceptance Scenarios**:

1. **Given** the `AWS-SETUP-CHECKLIST.md` exists, **When** I follow the "SES Setup" section, **Then** I should be able to send an email via the mail-service.
2. **Given** a 502 error from API Gateway, **When** I consult the "Troubleshooting" section, **Then** I should find a clear step to check the NLB health group.

---

### Edge Cases

- **Partial Failures**: If 4 services build but 1 fails, the entire pipeline must stop and NOT attempt a deployment to prevent a partial/inconsistent state.
- **Large Docker Layers**: How does the system handle ECR storage limits or slow push times? (Assumption: Latest tag optimization is used).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a GitHub Actions workflow that triggers on push/PR to `main`.
- **FR-002**: Pipeline MUST build all 5 Java services (Maven) and the NextJS frontend (npm).
- **FR-003**: System MUST push Docker images to Amazon ECR using unique commit SHA tags.
- **FR-004**: Pipeline MUST execute `cdk deploy --all --require-approval never --context env=dev`.
- **FR-005**: System MUST provide a manual checklist document (`AWS-SETUP-CHECKLIST.md`) covering SES, Cognito, and Account setup.
- **FR-006**: System MUST document at least 5 common troubleshooting scenarios and their fixes.
- **FR-007**: System MUST provide cost-optimization tips for the demo environment.

### Key Entities *(include if feature involves data)*

- **GitHub Secrets**: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.
- **ECR Repositories**: 5 microservice repos plus frontend repo.
- **CDK Context**: `env` variable mapping to development parameters.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Full E2E deployment from Git Push to Cloud Live takes less than 20 minutes.
- **SC-002**: 100% of successful PR builds pass the CDK Synthesis phase.
- **SC-003**: 0% manual commands required for the core build-to-deploy loop (except initial account setup).
- **SC-004**: Checklist identifies 100% of manual "sandbox" limitations (SES, Cognito).

## Assumptions

- Users have a GitHub account and have already configured Repository Secrets for AWS.
- The AWS account used has sufficient quotas for ECS Fargate and RDS.
- NextJS build is performed in the CI phase to verify code even if hosted via S3/CloudFront.
- Dependency on the Phase 6 CDK stacks being functional.
