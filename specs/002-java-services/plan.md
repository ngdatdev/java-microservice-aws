# Implementation Plan: Phase 2 - Java Microservices Implementation

This plan details the technical steps to implement the core logic for all 5 Spring Boot services, ensuring full AWS integration with LocalStack.

## Proposed Changes

### 1. Shared Infrastructure & Common Logic
- Ensure all services share a common Docker network (`aws_default`).
- Standardize the `AwsConfig` for LocalStack across all services.

### 2. Member Service (Member Domain)
#### [MODIFY] [pom.xml](file:///d:/a_project/aws/services/member-service/pom.xml)
- Add `aws-java-sdk-sns`, `aws-java-sdk-sqs`, `lombok`, `springdoc-openapi`.
#### [NEW] [Member.java](file:///d:/a_project/aws/services/member-service/src/main/java/com/demo/member/entity/Member.java)
- JPA entity for user data.
#### [NEW] [SnsPublisher.java](file:///d:/a_project/aws/services/member-service/src/main/java/com/demo/member/messaging/SnsPublisher.java)
- Logic to publish events to SNS topics.

---

### 3. File Service (S3 Support)
#### [MODIFY] [pom.xml](file:///d:/a_project/aws/services/file-service/pom.xml)
- Add `aws-java-sdk-s3`.
#### [NEW] [S3Service.java](file:///d:/a_project/aws/services/file-service/src/main/java/com/demo/file/service/S3Service.java)
- Wrapper for S3 upload/download logic.

---

### 4. Mail Service (SES & SQS)
#### [MODIFY] [pom.xml](file:///d:/a_project/aws/services/mail-service/pom.xml)
- Add `aws-java-sdk-ses`, `aws-java-sdk-sqs`.
#### [NEW] [SqsMailConsumer.java](file:///d:/a_project/aws/services/mail-service/src/main/java/com/demo/mail/messaging/SqsMailConsumer.java)
- Polling logic to consume mail requests.

---

### 5. Auth Service (Cognito)
#### [MODIFY] [pom.xml](file:///d:/a_project/aws/services/auth-service/pom.xml)
- Add `aws-java-sdk-cognitoidentityprovider`.
#### [NEW] [CognitoService.java](file:///d:/a_project/aws/services/auth-service/src/main/java/com/demo/auth/service/CognitoService.java)
- Integration with AWS Cognito.

---

### 6. Master Service (Aggregator/BFF)
#### [MODIFY] [pom.xml](file:///d:/a_project/aws/services/master-service/pom.xml)
- Add `spring-boot-starter-webflux`.
#### [NEW] [AggregatorController.java](file:///d:/a_project/aws/services/master-service/src/main/java/com/demo/master/controller/AggregatorController.java)
- Aggregation logic using `WebClient`.

## Verification Plan

### Automated Verification
- Run `mvn clean package` for each service to ensure no compilation issues.
- Use `curl` to test the status of each endpoint.
- Monitor `docker-compose logs` for messaging flow (SNS/SQS).

### Manual Verification
- Upload a file via File Service and verify it exists in LocalStack S3 (using `awslocal s3 ls`).
- Create a member and verify an email log is generated in the Mail Service database.
