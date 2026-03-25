# Task Breakdown: Phase 2 - Java Microservices Implementation

This task list breaks down the implementation of the 5 Java microservices into manageable steps.

## Phase 2.1: Member Service (8081)
- [ ] [TASK] Update `pom.xml` with SNS/SQS and Lombok dependencies.
- [ ] [TASK] Create `Member` entity and `MemberRepository`.
- [ ] [TASK] Implement `MemberService` and `MemberController`.
- [ ] [TASK] Implement `SnsPublisher` for Member events.
- [ ] [TASK] Configure `AwsConfig` for LocalStack SNS/SQS.
- [ ] [VERIFY] Test Member CRUD and SNS publishing via Logs.

## Phase 2.2: File Service (8082)
- [ ] [TASK] Update `pom.xml` with S3 SDK.
- [ ] [TASK] Create `FileMetadata` entity and repository.
- [ ] [TASK] Implement `S3Service` for LocalStack S3 integration.
- [ ] [TASK] Implement `FileController` (Upload/Download).
- [ ] [VERIFY] Test file upload to simulated S3.

## Phase 2.3: Mail Service (8083)
- [ ] [TASK] Update `pom.xml` with SES/SQS SDK.
- [ ] [TASK] Create `EmailLog` entity and repository.
- [ ] [TASK] Implement `SesEmailSender` for SES integration.
- [ ] [TASK] Implement `SqsMailConsumer` for background processing.
- [ ] [VERIFY] Test email sending flow from SQS.

## Phase 2.4: Auth Service (8084)
- [ ] [TASK] Update `pom.xml` with Cognito SDK and JWT library.
- [ ] [TASK] Implement `CognitoService` for User Pool operations.
- [ ] [TASK] Implement `AuthController` (Login/Register).
- [ ] [TASK] Implement `TokenValidationFilter`.
- [ ] [VERIFY] Test authentication flow with LocalStack.

## Phase 2.5: Master Service (8085)
- [ ] [TASK] Update `pom.xml` with WebClient/WebFlux.
- [ ] [TASK] Create `Category` and `SystemConfig` entities.
- [ ] [TASK] Implement `AggregatorController` (BFF logic).
- [ ] [VERIFY] Test aggregated dashboard endpoint.

## Phase 2.6: Final Integration & Verification
- [ ] [VERIFY] Run all 5 services simultaneously via Docker Compose.
- [ ] [VERIFY] Verify end-to-end "Member Created -> Mail Sent" flow.
