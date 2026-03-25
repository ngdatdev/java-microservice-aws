# 🚀 AWS Microservice Demo - PHASE 2: Java Microservices (All 5 Services)

[< Previous Phase: Phase 1](./phase-1.md) | [Next Phase: Phase 3 >](./phase-3.md)

---

## 📋 SYSTEM CONTEXT (Paste này vào đầu mọi session với AI Agent)

```
You are an expert AWS cloud architect and full-stack developer.
We are building a DEMO microservice system on AWS to learn infrastructure setup.
The goal is NOT production-perfect code, but working demos that use every AWS service listed.
Keep business logic minimal — focus on correct AWS integration patterns.

Tech stack:
- Backend: Java 17, Spring Boot 3.x, Maven
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Container: Docker → ECR → ECS Fargate
- Database: Amazon RDS PostgreSQL
- Auth: Amazon Cognito
- Storage: Amazon S3
- Email: Amazon SES
- Messaging: Amazon SNS + SQS
- API: Amazon API Gateway + NLB (internal) + CloudFront
- Monitoring: Amazon CloudWatch
- CI/CD: CodeCommit + CodeBuild + CodePipeline
- IaC: AWS CDK (TypeScript) or Terraform (pick one per agent)
```

---

### 🤖 PROMPT FOR AI AGENT — Member Service

```
TASK: Generate complete Java Spring Boot code for "member-service" microservice.

## Service: member-service (port 8081)
## Purpose: Manage user/member CRUD operations

## Tech: Java 17, Spring Boot 3.2, Maven, Spring Data JPA, PostgreSQL

## Required dependencies in pom.xml:
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- spring-boot-starter-actuator
- spring-boot-starter-validation
- postgresql driver
- aws-java-sdk-sns (v2)
- aws-java-sdk-sqs (v2)
- lombok
- springdoc-openapi-starter-webmvc-ui

## Generate ALL these files with COMPLETE code (no TODOs):

### 1. src/main/java/com/demo/member/
- MemberServiceApplication.java
- controller/MemberController.java
- service/MemberService.java
- service/MemberServiceImpl.java
- repository/MemberRepository.java
- entity/Member.java
- dto/MemberRequest.java
- dto/MemberResponse.java
- dto/ApiResponse.java
- config/AwsConfig.java
- config/CorsConfig.java
- messaging/SnsPublisher.java
- messaging/SqsListener.java
- exception/GlobalExceptionHandler.java
- exception/MemberNotFoundException.java

### 2. src/main/resources/
- application.yml
- application-local.yml

### 3. Root files:
- pom.xml
- Dockerfile
- .dockerignore

## API Endpoints to implement:
GET    /api/v1/members          - List all members (paginated)
GET    /api/v1/members/{id}     - Get member by ID
POST   /api/v1/members          - Create member → publish SNS event "MEMBER_CREATED"
PUT    /api/v1/members/{id}     - Update member → publish SNS event "MEMBER_UPDATED"
DELETE /api/v1/members/{id}     - Delete member → publish SNS event "MEMBER_DELETED"
GET    /api/v1/members/health   - Health check

## Member entity fields:
- id (UUID)
- email (unique)
- fullName
- phone
- status (ACTIVE/INACTIVE)
- createdAt
- updatedAt

## SNS Integration:
- On CREATE/UPDATE/DELETE, publish message to SNS topic
- Message format: {"event": "MEMBER_CREATED", "memberId": "xxx", "email": "xxx", "timestamp": "xxx"}
- SNS Topic ARN from env: SNS_TOPIC_ARN

## SQS Integration:
- Listen to SQS queue for messages from other services
- Log received messages to CloudWatch (just use @Slf4j logging)
- Queue URL from env: SQS_QUEUE_URL

## application.yml must include:
- spring.datasource with PostgreSQL config (from env vars)
- spring.jpa.hibernate.ddl-auto=update
- springdoc.api-docs.path=/v3/api-docs
- management.endpoints.web.exposure.include=health,info,metrics
- AWS region config

## Dockerfile:
- Multi-stage build
- Base: eclipse-temurin:17-jre-alpine
- Expose port 8081

Generate 100% complete, working code. No placeholder comments.
```

### 🤖 PROMPT FOR AI AGENT — File Service

```
TASK: Generate complete Java Spring Boot code for "file-service" microservice.

## Service: file-service (port 8082)
## Purpose: Handle file upload/download using Amazon S3

## Tech: Java 17, Spring Boot 3.2, Maven, AWS SDK v2 S3

## Dependencies same as member-service PLUS:
- aws-java-sdk-s3 (v2)
- spring-boot-starter-web (multipart support)

## Generate ALL files with COMPLETE code:

### Controllers/Services:
- FileController.java
- FileService.java / FileServiceImpl.java
- S3Service.java (wrapper around AWS S3 SDK)
- FileMetadataRepository.java
- FileMetadata entity (id, originalName, s3Key, s3Url, contentType, fileSize, uploadedBy, createdAt)
- FileUploadRequest.java / FileResponse.java
- AwsConfig.java (S3Client bean)

## API Endpoints:
POST   /api/v1/files/upload          - Upload file to S3, save metadata to DB
GET    /api/v1/files/{id}            - Get file metadata
GET    /api/v1/files/{id}/download   - Generate pre-signed URL (15 min expiry)
DELETE /api/v1/files/{id}            - Delete from S3 + DB
GET    /api/v1/files                 - List all files (paginated)
GET    /api/v1/files/health          - Health check

## S3 Integration:
- Bucket name from env: S3_BUCKET_NAME
- On upload: PutObjectRequest with ContentType
- Generate pre-signed URL using S3Presigner
- S3 key format: "uploads/{year}/{month}/{uuid}/{originalFilename}"
- After successful upload, publish SNS notification: {"event": "FILE_UPLOADED", "fileId": "xxx", "fileName": "xxx"}

## application.yml port: 8082
## Dockerfile expose port 8082

Generate 100% complete code.
```

### 🤖 PROMPT FOR AI AGENT — Mail Service

```
TASK: Generate complete Java Spring Boot code for "mail-service" microservice.

## Service: mail-service (port 8083)
## Purpose: Send emails via Amazon SES, triggered by SQS messages

## Dependencies:
- spring-boot-starter-web
- aws-java-sdk-ses (v2)
- aws-java-sdk-sqs (v2)
- spring-boot-starter-data-jpa
- postgresql driver
- lombok

## Generate ALL files:

### Components:
- MailController.java
- MailService.java / MailServiceImpl.java
- SesEmailSender.java (AWS SES wrapper)
- SqsMailConsumer.java (listens to SQS for mail requests)
- EmailLog entity (id, toEmail, subject, body, status, sentAt, errorMessage)
- EmailLogRepository.java
- SendEmailRequest.java / EmailResponse.java
- MailTemplateService.java (simple string templates, no template engine needed)

## API Endpoints:
POST /api/v1/mails/send           - Send email directly via SES
GET  /api/v1/mails/logs           - Get email sending history
GET  /api/v1/mails/logs/{id}      - Get single email log
GET  /api/v1/mails/health         - Health check

## SES Integration:
- From email from env: SES_FROM_EMAIL
- Send via SesClient.sendEmail()
- Support: subject, body (HTML), to address
- Log all sends to DB with status SUCCESS/FAILED

## SQS Consumer:
- Poll SQS queue every 5 seconds (use @Scheduled)
- Message format: {"to": "email@x.com", "subject": "xxx", "body": "xxx", "template": "MEMBER_WELCOME"}
- Simple templates: MEMBER_WELCOME, FILE_UPLOADED, SYSTEM_ALERT
- After processing, delete message from queue

## application.yml port: 8083
## Dockerfile expose 8083

Generate 100% complete code.
```

### 🤖 PROMPT FOR AI AGENT — Auth Service

```
TASK: Generate complete Java Spring Boot code for "auth-service" microservice.

## Service: auth-service (port 8084)
## Purpose: Handle authentication via Amazon Cognito

## Dependencies:
- spring-boot-starter-web
- aws-java-sdk-cognitoidentityprovider (v2)
- spring-boot-starter-data-jpa
- postgresql driver
- lombok
- jjwt (JWT parsing for Cognito token validation)

## Generate ALL files:

### Components:
- AuthController.java
- AuthService.java / AuthServiceImpl.java
- CognitoService.java (wraps AWS Cognito SDK)
- TokenValidationFilter.java (validate Cognito JWT)
- UserSession entity (id, cognitoSub, email, lastLogin, ipAddress)
- UserSessionRepository.java
- LoginRequest.java / LoginResponse.java / TokenResponse.java
- AuthConfig.java

## API Endpoints:
POST /api/v1/auth/register    - Register new user in Cognito User Pool
POST /api/v1/auth/login       - Authenticate, return Cognito tokens (AccessToken, IdToken, RefreshToken)
POST /api/v1/auth/logout      - Revoke tokens in Cognito
POST /api/v1/auth/refresh     - Refresh access token
POST /api/v1/auth/verify      - Verify email confirmation code
GET  /api/v1/auth/me          - Get current user info from token
GET  /api/v1/auth/health      - Health check

## Cognito Integration:
- CognitoIdentityProviderClient
- USER_PASSWORD_AUTH flow for login
- AdminCreateUser for register
- InitiateAuth for token refresh
- Env vars: COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID
- Parse JWT to extract user info (use JJWT library)

## application.yml port: 8084
## Dockerfile expose 8084

Generate 100% complete code.
```

### 🤖 PROMPT FOR AI AGENT — Master Service

```
TASK: Generate complete Java Spring Boot code for "master-service" microservice.

## Service: master-service (port 8085)
## Purpose: Manage master data (categories, config, lookup tables) — acts as BFF (Backend for Frontend) aggregator

## Dependencies:
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- postgresql driver
- lombok
- spring-boot-starter-webflux (for calling other services via WebClient)

## Generate ALL files:

### Components:
- MasterController.java
- CategoryController.java
- AggregatorController.java (calls other services)
- MasterService.java / MasterServiceImpl.java
- WebClientConfig.java (configure WebClient for each service)
- Category entity (id, code, name, description, isActive)
- SystemConfig entity (id, configKey, configValue, description)
- CategoryRepository.java / SystemConfigRepository.java
- Various DTOs

## API Endpoints:
GET  /api/v1/master/categories        - List all categories
POST /api/v1/master/categories        - Create category
GET  /api/v1/master/configs           - List system configs
POST /api/v1/master/configs           - Set config value
GET  /api/v1/master/dashboard         - Aggregated dashboard data (calls member-service + file-service)
GET  /api/v1/master/health            - Health check

## Service-to-Service calls (WebClient):
- GET {MEMBER_SERVICE_URL}/api/v1/members → aggregate member count
- GET {FILE_SERVICE_URL}/api/v1/files → aggregate file count  
- Return combined dashboard: {memberCount, fileCount, categories, recentActivity}

## application.yml port: 8085
## Dockerfile expose 8085

Generate 100% complete code.
```

---

[< Previous Phase: Phase 1](./phase-1.md) | [Next Phase: Phase 3 >](./phase-3.md)
