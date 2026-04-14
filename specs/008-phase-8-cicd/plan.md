---
status: "proposed"
created: 2026-04-03
---

# Implementation Plan: Phase 8 CI/CD & Ops Checklist

Finalize the DevOps automation and provide a hand-off manual for cloud operations.

## 1. Technical Context
The project requires a full CI/CD lifecycle using **GitHub Actions**. We already have a baseline `deploy-aws.yml`, but it lacks frontend integration, environment context handling, and automated build verification. 

**Dependencies:**
- GitHub Secrets for AWS Authentication.
- CDK CLI for infrastructure orchestration.
- Docker Engine (GitHub Runners) for containerization.

**Core Challenges:**
- **Build Efficiency**: Reducing the time to build 5 Java services sequentially.
- **Manual Handover**: Guiding users through the "sandbox-limited" AWS services (SES/Cognito) that cannot be perfectly automated via IaC.

## 2. Architecture & Design

### CI/CD Workflow Schema
1. **Verify (Job)**: Maven build for 5 services + Next.js `npm run build` + `cdk synth`.
2. **Build & Push (Job)**: Docker build/push for 6 images (5 services + 1 frontend) to ECR.
3. **Deploy (Job)**: `cdk deploy --all --context env=dev`.

### Operational Map
- `docs/AWS-SETUP-CHECKLIST.md` - Definite guide for account setup and troubleshooting.

## 3. Code Organization
```
/
├── .github/workflows/
│   └── deploy-aws.yml              # Optimized pipeline
└── docs/
    ├── AWS-SETUP-CHECKLIST.md       # Operational manual
    └── TROUBLESHOOTING.md           # Fail-safe guide (optional or included)
```

## 4. Implementation Phases

### Phase 1: Pipeline Optimization
1. Integrate Next.js build validation into the `verify_code` job.
2. Update the CDK deployment step to include the `--context env=dev` argument.
3. Ensure the pipeline correctly handles the GitHub SHA as the primary tag for ECR.

### Phase 2: Operational Documentation
1. Construct the `AWS-SETUP-CHECKLIST.md` based on the configuration prompt.
2. List manual steps for SES email verification and Cognito Client ID extraction.
3. Detail troubleshooting steps for common ECS/RDS/API Gateway errors (502, timeouts).

## 5. Verification Strategy
1. **GitHub Status Checks**: Pull Request build validation passes for both backend and frontend.
2. **CDK Integrity**: `cdk synth --context env=dev` executes without errors in CI.
3. **Manual Traceability**: Verify that the generated Checklist is actionable and logically follows the Master Playbook.

## 6. Constitution Check

- [x] **Principle I: Demo-First Architecture**: Confirmed. Focuses on showing the system works on AWS.
- [x] **Principle VIII: Verification & Local Parity**: Confirmed. Uses CI to mimic what we did local in Phase 7.
- [x] **Principle IX: Automated CI/CD Lifecycle**: Confirmed. This phase directly implements the newly added Ninth principle.
