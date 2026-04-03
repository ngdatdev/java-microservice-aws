---
description: "Task list template for feature implementation"
---

# Tasks: Phase 7 Local Testing & Demo Scripts

**Input**: Design documents from `/specs/007-phase-7-local-testing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Define `.env.example` at root pointing explicitly to localstack properties instead of public domains.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Establish central `docker-compose.yml` boilerplate schema defining correct Docker versioning and virtual network scopes.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Automated Topology Bootstrapping (Priority: P1) 🎯 MVP

**Goal**: Establish a complete offline infrastructure topology launching 8 targeted containers smoothly.

**Independent Test**: Can be validated simply by running `docker-compose config` or observing `docker-compose up -d` boot without immediate crashes.

### Implementation for User Story 1

- [x] T003 [US1] Append `postgres:15` image configured with 5 default backend databases mapped in `docker-compose.yml`.
- [x] T004 [US1] Append `localstack/localstack` image simulating S3/SES/SNS/SQS services alongside Postgres in `docker-compose.yml`.
- [x] T005 [P] [US1] Append `member-service` building `./services/member-service` mapping internally to LocalStack on port 8081 inside `docker-compose.yml`.
- [x] T006 [P] [US1] Append `file-service` building `./services/file-service` mapping internally to LocalStack on port 8082 inside `docker-compose.yml`.
- [x] T007 [P] [US1] Append `mail-service` building `./services/mail-service` mapping internally to LocalStack on port 8083 inside `docker-compose.yml`.
- [x] T008 [P] [US1] Append `auth-service` building `./services/auth-service` mapping internally to LocalStack on port 8084 inside `docker-compose.yml`.
- [x] T009 [P] [US1] Append `master-service` building `./services/master-service` mapping internally to LocalStack on port 8085 inside `docker-compose.yml`.
- [x] T010 [P] [US1] Append `frontend` building NextJS running on port 3000 inside `docker-compose.yml`.
- [x] T011 [US1] Wire synchronous healthchecks via `depends_on: postgres` preventing all Java/Next runtimes from booting before the database clears.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Scripted Mock Initialization (Priority: P2)

**Goal**: Provision mocked infrastructure items sequentially using awslocal immediately after Docker spins up.

**Independent Test**: Execution verifies offline elements exist via `awslocal s3 ls` inside the container.

### Implementation for User Story 2

- [x] T012 [P] [US2] Create standalone Bash file at `scripts/localstack-init.sh`
- [x] T013 [US2] Append S3 buckets and SNS topics instantiation inside `scripts/localstack-init.sh`.
- [x] T014 [US2] Append SQS configuration and route SQS subscriptions natively to SNS inside `scripts/localstack-init.sh`.
- [x] T015 [US2] Append SES simulated authorization identities inside `scripts/localstack-init.sh`.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - End-to-End Demonstration Playbook (Priority: P3)

**Goal**: Create sweeping automated test triggers handling offline mock boundaries.

**Independent Test**: Shell executes without timing out parsing internal localhost outputs.

### Implementation for User Story 3

- [x] T016 [P] [US3] Create `scripts/test-apis.sh` targeting E2E verification.
- [x] T017 [US3] Structure specific REST `cURL` POST inputs mimicking frontend payloads targeting User Authentication endpoints inside `scripts/test-apis.sh`.
- [x] T018 [US3] Structure specific REST `cURL` POST inputs mimicking form uploading hitting the S3 mock bound inside `scripts/test-apis.sh`.
- [x] T019 [US3] Structure explicit `cURL` pushes enforcing automated Email broadcast logs via the SES mock inside `scripts/test-apis.sh`.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T020 [P] Create comprehensive visual and explicit offline routing instructions at `docs/ARCHITECTURE.md`.
- [x] T021 [P] Establish step-by-step end-user consumption manual at `docs/DEMO-GUIDE.md`.
- [x] T022 Apply Execution permissions (`chmod +x`) uniformly to scripts built in Phase 4 and 5.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Defines baseline properties mapped across orchestrations.
- **Foundational (Phase 2)**: Boilerplate structure bounds the composition blocks.
- **User Stories (Phase 3+)**: US1 is the cornerstone dependency dictating US2's shell injection map. US3 exclusively targets US1's active bounds.
- **Polish (Final Phase)**: Documentation wraps around the established topology logic.

### Parallel Opportunities

- Java Service injections to Docker Compose (T005-T010) safely parallelize logic.
- Documentation bindings (T020, T021) parallelize easily post-design.

---

## Parallel Example: User Story 1

```bash
# Append service layers simultaneously
Task: "Append member-service mapping to LocalStack..."
Task: "Append file-service mapping to LocalStack..."
Task: "Append mail-service mapping to LocalStack..."
Task: "Append frontend mapping to 3000..."
```

---

## Implementation Strategy

### Incremental Delivery

1. Write the root environment variables (.env).
2. Establish the massive offline Compose orchestrator. (MVP)
3. Write bash wrappers (init-localstack.sh) hooking into LocalStack's `awslocal` tools to build mocked structures.
4. Execute End-to-End API verification sweeps (test-apis.sh) verifying traffic mapping bounds.
5. Provide manual Demonstration logs linking all behaviors cleanly.
