# 🚀 AWS Microservice Demo — Full Agent Prompts (All Phases)

> **Stack**: Java (Spring Boot) · Next.js · AWS ECS/ECR · RDS PostgreSQL · API Gateway · NLB · CloudFront · Route53 · Cognito · S3 · SES · SNS · SQS · CloudWatch · Direct Connect (mocked) · CodeCommit · CodeBuild · CodePipeline

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

## PHASE 1 — Project Structure & Local Dev Setup

### 🤖 PROMPT FOR AI AGENT

```
TASK: Generate the complete monorepo folder structure and local development setup for our AWS microservice demo.

## Project Name: aws-micro-demo

## Required folder structure:
aws-micro-demo/
├── infra/                          # AWS CDK (TypeScript)
│   ├── bin/app.ts
│   ├── lib/
│   │   ├── vpc-stack.ts
│   │   ├── ecs-stack.ts
│   │   ├── rds-stack.ts
│   │   ├── cognito-stack.ts
│   │   ├── s3-stack.ts
│   │   ├── sns-sqs-stack.ts
│   │   ├── ses-stack.ts
│   │   ├── cloudwatch-stack.ts
│   │   ├── apigateway-nlb-stack.ts
│   │   ├── cloudfront-stack.ts
│   │   └── cicd-stack.ts
│   ├── package.json
│   └── cdk.json
├── services/
│   ├── member-service/             # Java Spring Boot
│   ├── file-service/               # Java Spring Boot
│   ├── mail-service/               # Java Spring Boot
│   ├── auth-service/               # Java Spring Boot
│   └── master-service/             # Java Spring Boot
├── frontend/                       # Next.js 14
└── docker-compose.yml              # For local dev

## Requirements:
1. Generate the complete folder structure with ALL files listed (even if empty placeholders)
2. Generate root-level docker-compose.yml that starts all 5 services + PostgreSQL locally
3. Each Java service must have: pom.xml, Dockerfile, src/main/resources/application.yml
4. Generate .env.example at root with ALL required environment variables
5. Generate a README.md with step-by-step local setup instructions

## Docker Compose requirements:
- PostgreSQL 15 with 5 separate databases (one per service)
- Each Java service on different ports: 8081-8085
- Next.js on port 3000
- LocalStack container for local AWS service simulation (S3, SES, SNS, SQS)
- Health checks for all services

## Environment variables needed (generate .env.example):
# AWS
AWS_REGION=ap-northeast-1
AWS_ACCOUNT_ID=
# RDS
DB_HOST=localhost
DB_PORT=5432
# Cognito
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
# S3
S3_BUCKET_NAME=
# SES
SES_FROM_EMAIL=
# SNS
SNS_TOPIC_ARN=
# SQS
SQS_QUEUE_URL=
# Services
MEMBER_SERVICE_URL=http://localhost:8081
FILE_SERVICE_URL=http://localhost:8082
MAIL_SERVICE_URL=http://localhost:8083
AUTH_SERVICE_URL=http://localhost:8084
MASTER_SERVICE_URL=http://localhost:8085

Output everything as complete, copy-paste ready files.
```

---

## PHASE 2 — Java Microservices (All 5 Services)

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

## PHASE 3 — Next.js Frontend

### 🤖 PROMPT FOR AI AGENT

```
TASK: Generate a complete Next.js 14 (App Router) frontend for the AWS Microservice Demo.

## Tech: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui

## Purpose: Simple admin dashboard UI to demo all microservice APIs

## Required Pages & Components:

### Pages (app/ directory):
- app/page.tsx                    → Dashboard (calls master-service /dashboard)
- app/members/page.tsx            → Member list with Create/Edit/Delete
- app/members/[id]/page.tsx       → Member detail
- app/files/page.tsx              → File list + Upload UI
- app/auth/login/page.tsx         → Login form (calls auth-service)
- app/auth/register/page.tsx      → Register form
- app/mail/page.tsx               → Send test email form
- app/layout.tsx                  → Root layout with sidebar nav

### Components (components/):
- Navbar.tsx
- Sidebar.tsx (links: Dashboard, Members, Files, Send Mail)
- MemberTable.tsx (with pagination)
- MemberForm.tsx (create/edit modal)
- FileUploader.tsx (drag & drop, shows progress)
- FileList.tsx
- SendMailForm.tsx
- DashboardStats.tsx (cards: total members, files, etc.)
- AuthGuard.tsx (redirect to login if no token)
- Toast notifications

### API Layer (lib/):
- lib/api/members.ts      → fetch wrapper for member-service
- lib/api/files.ts        → fetch wrapper for file-service  
- lib/api/auth.ts         → fetch wrapper for auth-service
- lib/api/mail.ts         → fetch wrapper for mail-service
- lib/api/master.ts       → fetch wrapper for master-service
- lib/auth/token.ts       → localStorage token management
- lib/types.ts            → TypeScript interfaces

## Environment variables (next.config.js):
NEXT_PUBLIC_MEMBER_SERVICE_URL=http://localhost:8081
NEXT_PUBLIC_FILE_SERVICE_URL=http://localhost:8082
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:8084
NEXT_PUBLIC_MAIL_SERVICE_URL=http://localhost:8083
NEXT_PUBLIC_MASTER_SERVICE_URL=http://localhost:8085

## UI Requirements:
- Dark theme, professional admin dashboard look
- Show loading states and error messages
- Toast notifications for success/error actions
- Auth token stored in localStorage, sent as Bearer token in headers
- File upload shows progress bar
- Dashboard shows real-time stats cards

## File Upload flow:
1. User selects file → POST /api/v1/files/upload (multipart/form-data)
2. Show upload progress
3. Display file list with download button
4. Download button → GET /api/v1/files/{id}/download → open pre-signed URL

## Auth flow:
1. Login page → POST /api/v1/auth/login → store token
2. All API calls include Authorization: Bearer {token}
3. 401 response → redirect to login

Generate 100% complete working code for every file. Include package.json with all dependencies.
```

---

## PHASE 4 — AWS Infrastructure (CDK)

### 🤖 PROMPT FOR AI AGENT — VPC & Base Infrastructure

```
TASK: Generate AWS CDK TypeScript code for VPC and base networking infrastructure.

## File: infra/lib/vpc-stack.ts

## Requirements:
Create a VpcStack class that provisions:

### VPC:
- VPC with CIDR 10.0.0.0/16
- 2 Availability Zones
- Public subnets (for NLB, NAT Gateway)
- Private subnets (for ECS tasks, RDS)
- NAT Gateway (1, for cost saving in demo)
- Internet Gateway

### Security Groups (export for other stacks):
1. nlbSg — NLB SG: inbound from API Gateway VPC Link
2. ecsSg — ECS Tasks SG: inbound from nlbSg on service ports (8081-8085)
3. rdsSg — RDS SG: inbound from ecsSg on port 5432

### Exports (CfnOutput):
- VPC ID
- Private subnet IDs
- Public subnet IDs
- All security group IDs

### Stack props interface:
interface VpcStackProps extends cdk.StackProps {
  envName: string; // 'dev' | 'staging' | 'prod'
}

Generate complete TypeScript CDK code with proper typing and comments.
```

### 🤖 PROMPT FOR AI AGENT — RDS Stack

```
TASK: Generate AWS CDK TypeScript code for Amazon RDS PostgreSQL.

## File: infra/lib/rds-stack.ts

## Requirements:
Create RdsStack that provisions:

### RDS Instance:
- Engine: PostgreSQL 15.4
- Instance: db.t3.micro (demo/cost saving)
- DatabaseCluster or DatabaseInstance (use DatabaseInstance for simplicity)
- MultiAZ: false (demo)
- StorageEncrypted: true
- AutoMinorVersionUpgrade: true
- DeletionProtection: false (demo)
- BackupRetention: 1 day

### Database credentials:
- Use AWS Secrets Manager (CDK's DatabaseInstance.secret)
- Secret name: /aws-micro-demo/{envName}/rds-credentials

### Parameter Group:
- max_connections = 100
- log_statement = all (for demo visibility)

### Subnet Group:
- Use private subnets from VPC stack

### Outputs:
- RDS endpoint (host)
- RDS port
- Secret ARN

### Stack props:
- vpc, rdsSg, privateSubnets from VpcStack

Generate complete CDK TypeScript code.
```

### 🤖 PROMPT FOR AI AGENT — ECR & ECS Stack

```
TASK: Generate AWS CDK TypeScript code for ECR repositories and ECS Fargate cluster + services.

## Files: 
- infra/lib/ecr-stack.ts
- infra/lib/ecs-stack.ts

## ECR Stack (ecr-stack.ts):
Create one ECR repository per microservice:
- aws-micro-demo/member-service
- aws-micro-demo/file-service  
- aws-micro-demo/mail-service
- aws-micro-demo/auth-service
- aws-micro-demo/master-service

Each repository:
- imageTagMutability: MUTABLE
- imageScanOnPush: true
- lifecycleRule: keep last 10 images
- RemovalPolicy: DESTROY (demo)

Export all repository URIs as CfnOutput.

## ECS Stack (ecs-stack.ts):
Create ECS Fargate cluster and services:

### Cluster:
- ECS Cluster in the VPC
- CloudWatch Container Insights enabled
- Cluster name: aws-micro-demo-{envName}

### Task Definitions (one per service):
For each of the 5 services, create a FargateTaskDefinition:
- CPU: 256, Memory: 512 (demo/cost)
- Task Role with permissions for: S3, SES, SNS, SQS, CloudWatch Logs, Secrets Manager
- Container: from ECR repository
- Environment variables from SSM Parameter Store / Secrets Manager
- Port mappings
- Log driver: awslogs (CloudWatch)

### Services:
For each service, create a FargateService:
- Desired count: 1 (demo)
- Service discovery via AWS Cloud Map (for internal service-to-service calls)
- Security group: ecsSg
- Assign public IP: false (in private subnets)

### NLB (for API Gateway VPC Link):
- Network Load Balancer in private subnets
- Listeners for each service on unique ports (8081-8085)
- Target groups pointing to ECS services

### Auto Scaling:
- CPU-based scaling (target 70%) for each service
- Min: 1, Max: 3

Generate complete, working CDK TypeScript code.
```

### 🤖 PROMPT FOR AI AGENT — Cognito Stack

```
TASK: Generate AWS CDK TypeScript code for Amazon Cognito User Pool.

## File: infra/lib/cognito-stack.ts

## Requirements:

### User Pool:
- UserPool name: aws-micro-demo-users-{envName}
- Self sign-up: enabled
- Email verification: required
- Password policy: min 8 chars, require uppercase + lowercase + numbers
- MFA: OPTIONAL (for demo)
- Account recovery: EMAIL_ONLY
- Standard attributes: email (required), name (optional)

### User Pool Client:
- Client name: aws-micro-demo-web-client
- Auth flows: USER_PASSWORD_AUTH, REFRESH_TOKEN_AUTH
- No client secret (for frontend SPA use)
- Token validity: Access 1h, ID 1h, Refresh 30 days
- Callback URLs: http://localhost:3000/auth/callback, https://{cloudfront-domain}/auth/callback

### User Pool Domain:
- Domain prefix: aws-micro-demo-{envName}

### Outputs:
- User Pool ID
- User Pool Client ID
- User Pool Domain

Generate complete CDK TypeScript code with comments.
```

### 🤖 PROMPT FOR AI AGENT — S3 Stack

```
TASK: Generate AWS CDK TypeScript code for Amazon S3 buckets.

## File: infra/lib/s3-stack.ts

## Buckets to create:

### 1. File Storage Bucket (for file-service):
- Name: aws-micro-demo-files-{envName}-{accountId}
- Versioning: enabled
- Encryption: S3_MANAGED
- Block all public access: true
- CORS: allow PUT, POST, GET from * (demo) with headers Authorization, Content-Type
- Lifecycle rules:
  - Move to INTELLIGENT_TIERING after 30 days
  - Delete incomplete multipart uploads after 7 days
- Event notifications: S3 → SNS on ObjectCreated

### 2. Frontend Static Hosting Bucket (for Next.js build):
- Name: aws-micro-demo-frontend-{envName}-{accountId}  
- Block all public access: true (will use CloudFront OAC)
- Versioning: disabled
- Website hosting: disabled (use CloudFront)

### IAM Policy for ECS Task Role:
- Allow ECS tasks to: s3:GetObject, s3:PutObject, s3:DeleteObject on files bucket
- Allow s3:ListBucket on files bucket

### Outputs:
- File bucket name and ARN
- Frontend bucket name and ARN

Generate complete CDK TypeScript code.
```

### 🤖 PROMPT FOR AI AGENT — SNS & SQS Stack

```
TASK: Generate AWS CDK TypeScript code for Amazon SNS topics and SQS queues.

## File: infra/lib/sns-sqs-stack.ts

## Architecture (based on diagram):

### SNS Topics:
1. MemberEventsTopic — events from member-service (MEMBER_CREATED, MEMBER_UPDATED, MEMBER_DELETED)
2. FileEventsTopic — events from file-service (FILE_UPLOADED, FILE_DELETED)
3. NotificationsTopic — system notifications for build status, alerts

### SQS Queues:
1. MailServiceQueue — receives events to trigger emails
   - DLQ: MailServiceDLQ (max receive 3, retention 14 days)
   - Visibility timeout: 60s
   - Retention: 4 days

2. FileProcessingQueue — triggers file processing
   - DLQ: FileProcessingDLQ
   - Visibility timeout: 120s

3. MemberEventQueue — member-service consumes events from other services
   - DLQ: MemberEventDLQ

### Subscriptions (SNS → SQS):
- MemberEventsTopic → MailServiceQueue (filter: MEMBER_CREATED only)
- FileEventsTopic → MailServiceQueue (filter: FILE_UPLOADED only)
- MemberEventsTopic → MemberEventQueue

### Queue Policies:
- Allow SNS to send to each SQS queue

### IAM permissions for ECS tasks:
- Allow sns:Publish on all topics
- Allow sqs:SendMessage, sqs:ReceiveMessage, sqs:DeleteMessage on all queues
- Allow sqs:GetQueueAttributes

### Outputs:
- All Topic ARNs
- All Queue URLs
- All Queue ARNs

Generate complete CDK TypeScript code with detailed comments explaining the flow.
```

### 🤖 PROMPT FOR AI AGENT — API Gateway & NLB Stack

```
TASK: Generate AWS CDK TypeScript code for Amazon API Gateway (HTTP API) with NLB VPC Link integration.

## File: infra/lib/apigateway-nlb-stack.ts

## Architecture:
Internet → API Gateway (HTTP API) → VPC Link → NLB → ECS Services

## Requirements:

### VPC Link:
- Create VpcLink pointing to NLB in private subnets
- For HTTP API (not REST API)

### HTTP API Gateway:
- Name: aws-micro-demo-api-{envName}
- CORS: 
  allowOrigins: ['*'] (demo)
  allowMethods: [GET, POST, PUT, DELETE, OPTIONS]
  allowHeaders: [Authorization, Content-Type, X-Api-Key]

### Cognito Authorizer:
- JWT Authorizer using Cognito User Pool
- Applied to all routes EXCEPT /auth/* and /health

### Routes with NLB integration:
# Member Service
ANY /api/v1/members/{proxy+}     → NLB:8081
# File Service  
ANY /api/v1/files/{proxy+}       → NLB:8082
# Mail Service
ANY /api/v1/mails/{proxy+}       → NLB:8083
# Auth Service (NO auth required)
ANY /api/v1/auth/{proxy+}        → NLB:8084 (no authorizer)
# Master Service
ANY /api/v1/master/{proxy+}      → NLB:8085

### Stage:
- Default stage: $default (auto-deploy)
- Access logging to CloudWatch

### Usage Plan / Throttling (for demo):
- Rate limit: 100 req/s
- Burst: 200

### Outputs:
- API Gateway endpoint URL
- VPC Link ID

Generate complete CDK TypeScript code.
```

### 🤖 PROMPT FOR AI AGENT — CloudFront Stack

```
TASK: Generate AWS CDK TypeScript code for Amazon CloudFront distribution.

## File: infra/lib/cloudfront-stack.ts

## Two CloudFront distributions:

### 1. Frontend Distribution:
Origins:
- Primary: S3 bucket (frontend) with OAC (Origin Access Control)
  - Path: /*

Behaviors:
- Default (/*): S3 origin, CachingOptimized policy
- /api/*: API Gateway origin, CachingDisabled (pass-through)
  - Forward: Authorization header, all query strings

Cache settings:
- Default TTL: 86400s (24h) for static assets
- Min TTL: 0
- Error responses: 404 → /index.html (SPA routing)

Security headers (ResponseHeadersPolicy):
- Strict-Transport-Security
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY

Price class: PRICE_CLASS_100 (US/Europe only, cheapest)

### OAC (Origin Access Control):
- For S3 frontend bucket
- Update S3 bucket policy to allow CloudFront OAC

### Outputs:
- Frontend CloudFront domain
- Distribution ID (for cache invalidation in CI/CD)

Generate complete CDK TypeScript code.
```

### 🤖 PROMPT FOR AI AGENT — CloudWatch Stack

```
TASK: Generate AWS CDK TypeScript code for CloudWatch monitoring, dashboards, and alarms.

## File: infra/lib/cloudwatch-stack.ts

## Requirements:

### Log Groups (one per service):
- /aws-micro-demo/member-service
- /aws-micro-demo/file-service
- /aws-micro-demo/mail-service
- /aws-micro-demo/auth-service
- /aws-micro-demo/master-service
- /aws-micro-demo/ecs-cluster
Retention: 7 days (demo/cost)

### CloudWatch Dashboard:
Name: aws-micro-demo-dashboard-{envName}

Widgets to add:
1. ECS Service CPU Utilization (all 5 services) — line chart
2. ECS Service Memory Utilization — line chart
3. NLB TCP Reset Count — line chart
4. RDS CPU & Connections — line chart
5. SQS Queue Depth (all queues) — number widgets
6. SNS Messages Published — bar chart

### Alarms:
1. High CPU Alarm — any ECS service CPU > 80% for 5 min → SNS notification
2. NLB TCP Reset Alarm — TCP resets > 10 in 5 min → SNS notification
3. SQS DLQ Alarm — any DLQ has > 0 messages → SNS notification
4. RDS High CPU — RDS CPU > 80% → SNS notification

### SNS Topic for Alarms:
- AlarmNotificationTopic
- Email subscription (placeholder — user provides email)

Generate complete CDK TypeScript code with comments.
```

### 🤖 PROMPT FOR AI AGENT — SES Stack

```
TASK: Generate AWS CDK TypeScript code for Amazon SES (Simple Email Service) setup.

## File: infra/lib/ses-stack.ts

## Requirements:

### Email Identity:
- Verify domain or email address for sending
- Use CfnEmailIdentity
- DKIM signing: enabled
- EmailIdentity for: from-address (from env/config)

### Configuration Set:
- Name: aws-micro-demo-config-set
- Sending: enabled
- Reputation tracking: enabled
- Event destinations:
  - CloudWatch: track sends, bounces, complaints, deliveries
  - SNS: bounce and complaint notifications → NotificationsTopic

### IAM permissions for ECS Task Role:
- ses:SendEmail
- ses:SendRawEmail
- Restrict to only the verified identity (Resource condition)

### Suppression List:
- AccountLevel suppression for BOUNCES and COMPLAINTS

### Outputs:
- Verified email identity ARN
- Configuration set name

Generate complete CDK TypeScript code.
Note: SES sandbox mode requires manual AWS console verification for demo. Add this note in code comments.
```

---

## PHASE 5 — CI/CD Pipeline (CodeCommit + CodeBuild + CodePipeline)

### 🤖 PROMPT FOR AI AGENT

```
TASK: Generate AWS CDK TypeScript code for CI/CD pipeline matching the diagram:
- 3 pipelines: Dev, Staging, Production
- Using: CodeCommit, CodeBuild, CodePipeline, ECR, ECS, SNS

## File: infra/lib/cicd-stack.ts

## Pipeline Architecture (from diagram):
Developer → merge to develop → Dev Pipeline → ECR → ECS Dev → SNS notify
Team Lead → merge to staging → Staging Pipeline → ECR → ECS Staging → SNS notify
Team Lead → merge to master → Production Pipeline → build → SNS approval → approver approves → ECR → ECS Prod → SNS notify

## CodeCommit Repository:
- Name: aws-micro-demo
- Branch strategy: feature/* → develop → staging → master
- Description: AWS Microservice Demo monorepo

## CodeBuild Projects:

### 1. BuildProject (shared for build + test):
buildspec: build_spec.yaml content:
```yaml
version: 0.2
phases:
  install:
    runtime-versions:
      java: corretto17
  pre_build:
    commands:
      - echo Logging in to ECR...
      - aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=$COMMIT_HASH
  build:
    commands:
      - echo Build started on $(date)
      - cd services/member-service && mvn package -DskipTests
      - docker build -t $ECR_REGISTRY/member-service:$IMAGE_TAG .
      - docker push $ECR_REGISTRY/member-service:$IMAGE_TAG
      # Repeat for each service
  post_build:
    commands:
      - echo Build completed
      - aws sns publish --topic-arn $SNS_BUILD_TOPIC --message "Build $IMAGE_TAG completed"
```

### 2. DeployProject per environment:
deploy_dev.yaml, deploy_staging.yaml, deploy_production.yaml
```yaml
version: 0.2
phases:
  build:
    commands:
      - aws ecs update-service --cluster aws-micro-demo-dev --service member-service --force-new-deployment
      # Repeat for each service
```

## CodePipeline — Dev Pipeline:
Name: aws-micro-demo-dev-pipeline
Trigger: CodeCommit develop branch push
Stages:
  1. Source: CodeCommit → develop branch
  2. Build: CodeBuild (build_spec.yaml) — build + push all images to ECR with tag COMMIT_HASH
  3. Deploy: CodeBuild (deploy_dev.yaml) — update ECS Dev services
  4. Notify: SNS publish "Dev deployment complete"

## CodePipeline — Staging Pipeline:
Name: aws-micro-demo-staging-pipeline
Trigger: CodeCommit staging branch push
Same stages as Dev but targeting ECS Staging

## CodePipeline — Production Pipeline:
Name: aws-micro-demo-prod-pipeline
Trigger: CodeCommit master branch push
Stages:
  1. Source: CodeCommit → master branch
  2. Build: CodeBuild build + push to ECR
  3. Approval: Manual approval via SNS email notification to approver
  4. Deploy: CodeBuild deploy to ECS Prod
  5. Notify: SNS publish "Production deployment complete"

## IAM Roles:
- CodePipeline role: access to CodeCommit, CodeBuild, S3 artifacts, SNS
- CodeBuild role: ECR push/pull, ECS update-service, SNS publish, CloudWatch logs

## S3 Artifact Bucket:
- Pipeline artifacts bucket (CodePipeline requirement)

## Buildspec files:
Generate actual buildspec YAML files:
- infra/buildspec/build_spec.yaml
- infra/buildspec/deploy_dev.yaml
- infra/buildspec/deploy_staging.yaml
- infra/buildspec/deploy_production.yaml

Generate complete CDK TypeScript code + all buildspec files.
```

---

## PHASE 6 — CDK App Entry Point & Deployment

### 🤖 PROMPT FOR AI AGENT

```
TASK: Generate the CDK app entry point and deployment scripts.

## File: infra/bin/app.ts

Requirements:
- Instantiate all stacks in correct dependency order:
  1. VpcStack
  2. RdsStack (needs VpcStack)
  3. EcrStack
  4. CognitoStack
  5. S3Stack
  6. SnsStack (create SNS topics first)
  7. SqsStack (needs SnsStack for subscriptions)
  8. SesStack
  9. CloudWatchStack
  10. EcsStack (needs all above)
  11. ApiGatewayStack (needs EcsStack NLB)
  12. CloudFrontStack (needs S3Stack + ApiGatewayStack)
  13. CicdStack (needs EcrStack + EcsStack)

- Pass outputs between stacks using stack references
- Support multiple environments via CDK_ENV context:
  cdk deploy --context env=dev
  cdk deploy --context env=staging
  cdk deploy --context env=prod

- Tags: add standard tags to all resources:
  Project: aws-micro-demo
  Environment: {envName}
  ManagedBy: CDK

## File: infra/cdk.json:
- App command
- Context defaults for dev environment

## Deployment Scripts (infra/scripts/):
- deploy-dev.sh
- deploy-staging.sh
- deploy-prod.sh
- destroy-dev.sh (for cleanup)

## File: infra/package.json:
scripts:
  deploy:dev: cdk deploy --all --context env=dev
  deploy:staging: cdk deploy --all --context env=staging
  diff: cdk diff
  synth: cdk synth

Generate complete code for all files.
```

---

## PHASE 7 — Local Testing & Demo Scripts

### 🤖 PROMPT FOR AI AGENT

```
TASK: Generate scripts and documentation for local testing and AWS demo.

## 1. docker-compose.yml (root level) — COMPLETE version:
Services:
- postgres: image postgres:15, 5 databases initialized via init.sql
- localstack: image localstack/localstack, services: s3,ses,sns,sqs
- member-service: build ./services/member-service, port 8081
- file-service: build ./services/file-service, port 8082
- mail-service: build ./services/mail-service, port 8083
- auth-service: build ./services/auth-service, port 8084
- master-service: build ./services/master-service, port 8085
- frontend: build ./frontend, port 3000

All services depend_on postgres with health check.
All Java services have env vars pointing to postgres and localstack.

## 2. scripts/init-localstack.sh:
Initialize LocalStack resources:
- Create S3 bucket
- Create SNS topics  
- Create SQS queues
- Subscribe SQS to SNS
- Verify SES email

## 3. scripts/test-apis.sh:
Bash script using curl to test all endpoints:
# Test member-service
curl -X POST http://localhost:8081/api/v1/members \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.com","fullName":"Test User","phone":"0123456789","status":"ACTIVE"}'
# Test file upload
curl -X POST http://localhost:8082/api/v1/files/upload \
  -F "file=@./test-files/sample.pdf"
# Test send email
curl -X POST http://localhost:8083/api/v1/mails/send \
  -H "Content-Type: application/json" \
  -d '{"to":"recipient@demo.com","subject":"Test Email","body":"Hello from mail-service"}'
# ... all other endpoints

## 4. docs/ARCHITECTURE.md:
Complete architecture documentation explaining:
- Every AWS service used and WHY
- Data flow diagrams (text-based)
- Service-to-service communication map
- How to access each service locally vs on AWS

## 5. docs/DEMO-GUIDE.md:
Step-by-step demo guide:
1. Start local environment
2. Register a user (auth flow)
3. Create members (SNS events demo)
4. Upload a file (S3 + pre-signed URL demo)
5. Send email (SES demo)
6. Check CloudWatch logs
7. Show SNS → SQS message flow

Generate all files with complete, working content.
```

---

## PHASE 8 — AWS Services Configuration Checklist

### 🤖 PROMPT FOR AI AGENT

```
TASK: Generate a complete AWS manual configuration checklist and troubleshooting guide.

Create docs/AWS-SETUP-CHECKLIST.md with:

## Pre-deployment checklist:
### AWS Account Setup:
- [ ] AWS CLI configured (aws configure)
- [ ] CDK bootstrapped: cdk bootstrap aws://{ACCOUNT_ID}/{REGION}
- [ ] Verify AWS_ACCOUNT_ID and AWS_REGION in .env

### SES Setup (MUST be manual):
- [ ] Go to SES Console → Verified Identities
- [ ] Verify your FROM email address
- [ ] Request SES production access (exit sandbox) OR add recipient emails to sandbox
- [ ] Verify SES configuration set exists after CDK deploy

### Cognito Setup:
- [ ] After CDK deploy, note User Pool ID and Client ID
- [ ] Update .env / SSM parameters
- [ ] Test registration flow

### Route53 (optional for demo):
- [ ] Register domain or use existing
- [ ] Create hosted zone
- [ ] Point to CloudFront distribution

### CodeCommit Setup:
- [ ] Generate Git credentials for CodeCommit (IAM → Security credentials)
- [ ] Add remote: git remote add aws {codecommit-url}
- [ ] Push code: git push aws develop

## Post-deployment verification:
- [ ] ECS services running (check ECS console)
- [ ] RDS accessible from ECS (check security groups)
- [ ] API Gateway endpoint responding
- [ ] CloudFront serving frontend
- [ ] SNS → SQS message flow working
- [ ] CloudWatch logs appearing
- [ ] CodePipeline triggered on commit

## Common errors and fixes:
1. ECS task failing to start → Check CloudWatch logs → likely missing env vars
2. RDS connection refused → Check security group rules
3. S3 upload fails → Check IAM task role permissions
4. SES not sending → Still in sandbox mode
5. API Gateway 502 → NLB target group unhealthy
6. CodeBuild ECR login fails → CodeBuild role missing ECR permissions

## Cost estimation (demo environment, ap-northeast-1):
- ECS Fargate (5 tasks × 0.25vCPU × 0.5GB): ~$15/month
- RDS t3.micro: ~$20/month
- API Gateway: ~$1/million requests
- CloudFront: ~$1/month (low traffic)
- NAT Gateway: ~$45/month ← turn off when not demoing!
- Total estimate: ~$80-100/month

## Cost saving tips:
- Use VPC endpoints instead of NAT Gateway for ECR/S3/SQS access
- Set ECS desired count to 0 when not testing
- Use RDS stop/start feature
- Delete NAT Gateway after demo

Generate the complete markdown document.
```

---

## 📊 Summary: AWS Services Used vs Purpose

| AWS Service | Used In | Purpose |
|---|---|---|
| ECS Fargate | All services | Run microservice containers |
| ECR | All services | Store Docker images |
| RDS PostgreSQL | All services | Database |
| API Gateway (HTTP) | Frontend entry | Route requests, Cognito auth |
| NLB | Internal | VPC Link target for API GW |
| CloudFront | Frontend | CDN + S3 static hosting |
| Route53 | DNS | Domain routing |
| Cognito | auth-service | User auth, JWT tokens |
| S3 | file-service, frontend | File storage + static hosting |
| SES | mail-service | Send emails |
| SNS | All services | Event pub/sub |
| SQS | mail-service, file-service | Async message queue |
| CloudWatch | All | Logs, metrics, alarms, dashboard |
| Secrets Manager | RDS credentials | Secure secret storage |
| CodeCommit | CI/CD | Git repository |
| CodeBuild | CI/CD | Build + deploy pipeline |
| CodePipeline | CI/CD | Orchestrate Dev/Staging/Prod flows |
| Direct Connect | Mocked | External system integration (use VPN mock) |

---

## 🎯 Quick Start Order

```
Phase 1 → Generate project structure
Phase 2 → Generate all 5 Java services
Phase 3 → Generate Next.js frontend
Phase 4 → Generate all CDK stacks (8 prompts)
Phase 5 → Generate CI/CD pipeline CDK
Phase 6 → Generate CDK entry point + deploy scripts
Phase 7 → Generate docker-compose + test scripts
Phase 8 → Generate setup checklist

Local test: docker-compose up
AWS deploy: cd infra && npm run deploy:dev
```
