# 🚀 AWS Microservice Demo - PHASE 4: AWS Infrastructure (CDK)

[< Previous Phase: Phase 3](./phase-3.md) | [Next Phase: Phase 5 >](./phase-5.md)

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

[< Previous Phase: Phase 3](./phase-3.md) | [Next Phase: Phase 5 >](./phase-5.md)
