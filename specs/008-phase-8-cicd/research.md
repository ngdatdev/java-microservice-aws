# Research & Architectural Decisions: Phase 8

## 1. Multi-Service Build Strategy
- **Decision**: Use a single GitHub Actions workflow with a matrix or sequential loop for builds.
- **Rationale**: While a matrix provides parallel execution, for a demo repository with 5 services, a sequential loop in a single job is easier to monitor and reduces complexity in handling ECR login windows. We will prioritize reliability over 2-3 minutes of build speed.
- **Alternatives considered**: Separate workflows per service (leads to configuration drift), GitHub Actions Matrix (good, but requires complex artifact sharing for a single CDK deploy step).

## 2. Infrastructure as Code (IaC) Integration
- **Decision**: Run `cdk deploy` directly in the GitHub Action runner using the CDK CLI.
- **Rationale**: Maintains a single source of truth for deployment. By passing `--require-approval never`, we enable hands-off continuous delivery.
- **Security**: AWS Credentials will be managed as GitHub Secrets and injected via `aws-actions/configure-aws-credentials`.

## 3. Image Tagging & Traceability
- **Decision**: Tag Docker images with both `latest` and `${{ github.sha }}`.
- **Rationale**: `latest` allows for easy manual debugging/pulling, while the Commit SHA ensures that the ECS task definition points to a specific, immutable version of the code that triggered the build.

## 4. Manual Configuration Management
- **Decision**: Formalize SES and Cognito setup into a standalone `AWS-SETUP-CHECKLIST.md`.
- **Rationale**: Some AWS services (especially SES in sandbox mode and Cognito User Pool Clients requiring secret updates) have "out-of-band" manual steps that IaC cannot fully automate without increasing complexity beyond demo-level needs. 
- **Guidance**: The checklist will be the primary reference for the "Final Verification" phase.
