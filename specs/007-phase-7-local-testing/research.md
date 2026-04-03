# Research & Architectural Decisions: Phase 7

## 1. Mocking Technology Strategy
- **Decision**: Utilize `localstack/localstack` as the mocking provider via Docker Compose.
- **Rationale**: LocalStack natively supports creating dummy SES boundaries, S3 storage, and full SNS-to-SQS topological bindings identically to AWS API endpoints. It integrates safely alongside standard Postgres image routing.
- **Alternatives considered**: AWS SAM local (heavy configuration parsing overhead), or running mocked java queues natively (breaks IaC parity). LocalStack matches the true infrastructure interface completely.

## 2. Test Integration Methodology
- **Decision**: Trigger endpoint verifications using raw generic `cURL` inside `.sh` shell scripts.
- **Rationale**: Scripts are universally portable. No external dependency tools like Postman Newman or Karate are required. Any local evaluator can launch a bash script and instantly get HTTP payload responses for validations against the mocked infrastructure.
- **Alternatives considered**: Postman definitions (introduces overhead and UI constraints), Jest offline APIs (increases code dependency layers).

## 3. Orchestration Alignment Decision
- **Decision**: Merge exactly 8 targeted image nodes together using `depends_on: postgres` coupled with healthchecks. Inject custom entrypoint environmental variables specifically aiming the service layer at `http://localstack:4566`.
- **Rationale**: Provides synchronous start-up sequences ensuring backend APIs wait for data persistence clusters to solidify. Bypasses real AWS connectivity by forcefully wrapping AWS SDK domains using Spring overriding `spring.cloud.aws.endpoint`.
