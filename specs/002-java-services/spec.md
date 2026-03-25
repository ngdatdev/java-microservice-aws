# Specification: Phase 2 - Java Microservices Implementation

This phase focuses on implementing the core logic for the 5 Spring Boot microservices, including REST APIs and integration with simulated AWS services (LocalStack).

## User Stories

- As a developer, I want all 5 services to have complete CRUD functionality for their respective domains.
- As a developer, I want services to communicate asynchronously via SNS/SQS.
- As a developer, I want files to be uploaded to and downloaded from S3 (LocalStack).
- As a developer, I want authentication to be handled by Cognito (LocalStack).

## Functional Requirements

### 1. Member Service (Port 8081)
- CRUD operations for `Member` entity.
- Publish `MEMBER_CREATED`, `MEMBER_UPDATED`, `MEMBER_DELETED` events to SNS.
- Listen to SQS for cross-service messages.

### 2. File Service (Port 8082)
- Upload files to S3.
- Manage file metadata in PostgreSQL.
- Generate pre-signed URLs for downloads.
- Publish `FILE_UPLOADED` events to SNS.

### 3. Mail Service (Port 8083)
- Send emails via Amazon SES.
- Consume mail requests from SQS (`mail-queue`).
- Support templates: `MEMBER_WELCOME`, `FILE_UPLOADED`.
- Log all email history to DB.

### 4. Auth Service (Port 8084)
- User registration and login via Amazon Cognito.
- Token validation and refresh.
- Manage user sessions in DB.

### 5. Master Service (Port 8085)
- Manage categories and system configurations.
- Act as a Backend-for-Frontend (BFF) aggregator.
- Aggregate dashboard data by calling Member and File services via WebClient.

## Technical Constraints
- Tech Stack: Java 17, Spring Boot 3.4.1, Maven, PostgreSQL.
- AWS SDK: Java SDK v2 (S3, SNS, SQS, SES, Cognito).
- Port assignments: 8081 (Member), 8082 (File), 8083 (Mail), 8084 (Auth), 8085 (Master).
- Local Simulation: All AWS calls must target LocalStack via environment variables.

## Acceptance Criteria
- [ ] All 5 services boot correctly.
- [ ] All 30+ endpoints defined in the prompts are functional.
- [ ] SNS/SQS messaging flow (Member -> SNS -> SQS -> Mail) works locally.
- [ ] S3 upload/download works via LocalStack.
- [ ] Actuator `/health` endpoints return `UP` for all services.
- [ ] Swagger/OpenAPI UI is accessible for each service.
