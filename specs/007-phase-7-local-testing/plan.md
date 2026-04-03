---
status: "proposed"
created: 2026-04-03
---

# Implementation Plan: Phase 7 Local Testing & Demo Scripts

## 1. Technical Context

This phase configures the foundational architecture enabling absolute 100% offline workflow execution. By leveraging Docker Compose and LocalStack, developers bypass cloud-native dependency blocks, establishing a perfectly localized sandbox mirroring the Phase 6 CDK infrastructure map.

**Dependencies:**
- Docker Engine for executing image virtualization.
- `localstack/localstack` for emulating Cloud components cleanly.
- Shell (`bash`) availability for the `init-localstack` and `test-apis` verifications.

**Core Challenges & Solutions:**
- **Synchronized Initialization Trap**: Databases must boot and run health checks *before* the application services dial out, avoiding race condition initialization crashes. Resolved by enforcing `depends_on: condition: service_healthy` across standard definitions.
- **Service Domain Wiring**: Routing microservice HTTP traffic away from AWS cloud links natively towards `http://localhost:4566` (LocalStack) endpoints using explicit application properties and `.env` bridging parameters.

## 2. Architecture & Design

### Component Map
*   **Root `docker-compose.yml`**: Defines exactly 8 target spaces: `postgres:15`, `localstack` image, 5 java Spring microservices mapped to ports (8081-8085), and 1 NextJS frontend runtime on 3000.
*   **`scripts/init-localstack.sh`**: A bash routine passing internal commands to the `awslocal` binary inside the LocalStack container (creates S3 dummy buckets, SNS notifications, hooks SQS subscriptions).
*   **`scripts/test-apis.sh`**: A cURL testing sweep executing specific POST/GET commands against the containerized endpoints.
*   **Documentation Maps**: Detailed MarkDown instructions explaining exactly how this architecture flows and how someone can interact with it physically.

## 3. Code Organization

```
/
├── docker-compose.yml              # The core orchestrator
├── .env.example                    # Reference config mapping properties locally
├── scripts/
│   ├── init-localstack.sh          # Infrastructure bootstrapper mock
│   └── test-apis.sh                # End-to-end endpoint tester
└── docs/
    ├── ARCHITECTURE.md             # Top-level mapping analysis
    └── DEMO-GUIDE.md               # User-friendly demonstration steps
```

## 4. Implementation Phases

### Phase 1: Local Docker Pipeline Definitions
Orchestrate the environment dependencies.
1. Draft the `docker-compose.yml` and rigorously define health checks targeting the dummy Postgres instance to block rapid boot failures.
2. Ensure Spring profiles (`application.yml` via AWS Config overrides) intercept AWS SDK logic and enforce `http://localstack:4566`.

### Phase 2: Mock Configuration Shell Scripts
1. Build `scripts/init-localstack.sh` utilizing LocalStack's integrated `awslocal` terminal alias to format queues, topics, buckets, and SES authorizations explicitly matching the resource names dictated in Phase 6.

### Phase 3: E2E Demonstration Triggers
1. Create `scripts/test-apis.sh` using generic raw `cURL` POST commands sending JSON models mimicking frontend requests directly into the backend (simulating Auth, File Uploading, Mail sending) to witness the SNS pipeline.

### Phase 4: Scribe Offline Manuals
1. Systematically outline the logic tree and access paths in `docs/ARCHITECTURE.md`.
2. Construct the visual walkthrough (`docs/DEMO-GUIDE.md`) to instruct users on how to properly boot and test the entire offline architecture manually as detailed within this spec constraint.

## 5. Verification Strategy

1. **Compilation Check**: `docker-compose up` completes building and runs natively without cyclic crashes.
2. **Infrastructure Hook Test**: `bash scripts/init-localstack.sh` produces successful IDs without rejection logic parameters.
3. **Smoke Test Execution**: The API script responds with 2xx / 3xx statuses universally on all targeted backends.

## 6. Constitution Check

- [x] **Principle I: Demo-First Architecture**: Strictly adheres to ensuring testing strategies bypass heavy business logic overhead.
- [x] **Principle II: Minimal Business Logic**: Keeps external integration patterns as dummy representations locally.
- [x] **Principle VIII: Verification & Local Parity**: Fulfilled completely via defining strict 8-container limits alongside `init-localstack` testing bounds.
