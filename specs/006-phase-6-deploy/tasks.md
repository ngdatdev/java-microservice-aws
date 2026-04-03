---
description: "Task list template for feature implementation"
---

# Tasks: Phase 6 CDK App Entry Point & Deployment

**Input**: Design documents from `/specs/006-phase-6-deploy/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize the unified CDK application context by setting context arrays in `infra/cdk.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Purge or remodel the legacy `infra.ts` to clear execution paths.
- [x] T003 Create the pristine entry point construct in `infra/bin/app.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Deploy All AWS Infrastructure (Priority: P1) 🎯 MVP

**Goal**: Execute a single deployment command that provisions all AWS resources in the correct dependency order so that the cloud environment is fully functional without manual intervention.

**Independent Test**: Can be fully tested by running `npx cdk synth` to verify structural constraints.

### Implementation for User Story 1

- [x] T004 [US1] Instantiate VpcStack, RdsStack, and EcrStack in strict sequence in `infra/bin/app.ts`
- [x] T005 [US1] Instantiate CognitoStack and S3Stack in `infra/bin/app.ts`
- [x] T006 [US1] Instantiate SnsStack, SqsStack, SesStack, and CloudwatchStack in `infra/bin/app.ts`
- [x] T007 [US1] Instantiate Compute core (EcsStack, ApiGatewayStack) linked via Native references in `infra/bin/app.ts`
- [x] T008 [US1] Instantiate Edge delivery (CloudfrontStack) and CI/CD root in `infra/bin/app.ts`
- [x] T009 [US1] Wire AWS cross-stack entity references natively across all 13 stacks

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently via successful compilation (`npx cdk synth`).

---

## Phase 4: User Story 2 - Environment Context Switching (Priority: P2)

**Goal**: Deploy identical infrastructure across different environments by passing a context flag.

**Independent Test**: Attempt `npx cdk synth --context env=staging`.

### Implementation for User Story 2

- [x] T010 [P] [US2] Register default `dev` context payload in `infra/cdk.json`
- [x] T011 [US2] Modify root constructs in `app.ts` to actively capture and propagate context environment variables to Stack Props.
- [x] T012 [P] [US2] Assign Universal Tags (`Project`, `Environment`, `ManagedBy: CDK`) recursively to the root App context in `app.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Streamlined Deployment Scripts (Priority: P3)

**Goal**: Pre-configured npm scripts and shell scripts to manage deployments.

**Independent Test**: Execute `npm run deploy:dev` dry-run.

### Implementation for User Story 3

- [x] T013 [P] [US3] Create shell automation `infra/scripts/deploy-dev.sh`
- [x] T014 [P] [US3] Create shell automation `infra/scripts/deploy-staging.sh`
- [x] T015 [P] [US3] Create shell automation `infra/scripts/deploy-prod.sh`
- [x] T016 [P] [US3] Create shell teardown `infra/scripts/destroy-dev.sh`
- [x] T017 [US3] Bind execution aliases inside `infra/package.json` pointing to newly generated scripts.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T018 Ensure all shell scripts have correct Execution permissions `chmod +x`
- [x] T019 Execute compilation sanity check against all files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational
- **User Story 2 (P2)**: Integrates modifying arguments onto US1 base.
- **User Story 3 (P3)**: Puts automation wrappers around US1 outputs.

### Within Each User Story

- Execution logic before CLI configuration mappings
- Core CDK syntax before Bash Wrappers

### Parallel Opportunities

- Shell scripts (T013-T016) can be parallelized.
- Modifying `cdk.json` (T010) safely parallelizes against Stack declarations.

---

## Parallel Example: User Story 3

```bash
# Launch parallel bash wrapper creations
Task: "Create `deploy-staging.sh`"
Task: "Create `deploy-prod.sh`"
Task: "Create `destroy-dev.sh`"
```

---

## Implementation Strategy

### Incremental Delivery

1. Setup Context Config + Build App.ts shell (Foundations)
2. Define rigorous 13-stack hierarchy natively typed
3. Hook Environment Tags over entire root Construct tree
4. Tie endpoints back to node runtime via script injection
