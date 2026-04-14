---
description: "Task list for Phase 8 implementation"
---

# Tasks: Phase 8 CI/CD & Ops Checklist

**Input**: Design documents from `/specs/008-phase-8-cicd/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- [x] T001 Register `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in GitHub Repository Secrets. (Manual task, Documented in Guide).

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T002 Establish the `deploy-aws.yml` file with global `on` triggers (push/pr) and environment mappings.

---

## Phase 3: User Story 1 - Automated Multi-Service Deployment (Priority: P1) 🎯 MVP

- [x] T003 [US1] Implement Docker build and push logic for all 5 services with `IMAGE_TAG=${{ github.sha }}` in `.github/workflows/deploy-aws.yml`.
- [x] T004 [US1] Implement `cdk deploy --all --context env=dev` step with `--require-approval never` in `.github/workflows/deploy-aws.yml`.

---

## Phase 4: User Story 2 - PR Build & Infrastructure Validation (Priority: P2)

- [x] T005 [P] [US2] Add Next.js `npm ci` and `npm run build` steps to the verification job in `.github/workflows/deploy-aws.yml`.
- [x] T006 [P] [US2] Add `cdk synth --context env=dev` step to the verification job in `.github/workflows/deploy-aws.yml`.

---

## Phase 5: User Story 3 - Comprehensive Operational Checklist (Priority: P3)

- [x] T007 [P] [US3] Create `docs/AWS-SETUP-CHECKLIST.md` with IAM/CDK bootstrap and SES/Cognito manual configuration steps.
- [x] T008 [P] [US3] Define post-deployment verification checkpoints (ECS Task logs, RDS pings) in `docs/AWS-SETUP-CHECKLIST.md`.
- [x] T009 [P] [US3] Draft the "Troubleshooting & Cost Tips" section (ECS 502, NAT Gateway management) in `docs/AWS-SETUP-CHECKLIST.md`.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T010 Finalize workflow labels and ensure cross-platform (LF/CRLF) compatibility for scripts referenced in `tasks.md`.
