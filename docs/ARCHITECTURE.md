# AWS Micro Demo — System Architecture Documentation

> **Created:** 2026-04-17
> **Region:** ap-southeast-1
> **Services:** 5 microservices + RDS + S3 + SNS/SQS + Cognito + API Gateway

---

## 1. System Architecture Flow

```
                              ┌─────────────────────────────────────────────────────┐
                              │                      AWS Cloud                       │
                              │                                                     │
                              │   ┌─────────────────────────────────────────────┐  │
                              │   │              ap-southeast-1                    │  │
                              │   │                                              │  │
┌──────────┐                  │   │  ┌────────────────────────────────────────┐ │  │
│          │   HTTPS           │   │  │          VPC  (10.0.0.0/16)             │ │  │
│  Client  │ ──────────────►   │   │  │                                         │ │  │
│  Browser │   (CDN cached     │   │  │  ┌──────────────────────────────────┐  │ │  │
│          │    or direct)      │   │  │  │  PUBLIC SUBNETS (2 AZs)        │  │ │  │
└──────────┘                  │   │  │  │  10.0.0.0/24, 10.0.1.0/24         │  │ │  │
     │                       │   │  │  └──────────────────────────────────┘  │ │  │
     │                       │   │  │                                       │ │  │
     │                       │   │  │  ┌──────────────────────────────────┐  │ │  │
     │                       │   │  │  │  PRIVATE_SUBNETS (2 AZs)         │  │ │  │
     │                       │   │  │  │  10.0.2.0/24, 10.0.3.0/24        │  │ │  │
     │                       │   │  │  │                                  │  │ │  │
     │                       │   │  │  │  ┌────────────────────────────┐  │  │ │  │
     │                       │   │  │  │  │  ECS Fargate Tasks         │  │  │ │  │
     │                       │   │  │  │  │  ┌──────────────────────┐  │  │  │ │  │
     │                       │   │  │  │  │  │ auth-service :8084   │  │  │  │ │  │
     │                       │   │  │  │  │  │ member-service :8081  │  │  │  │ │  │
     │                       │   │  │  │  │  │ file-service :8082   │  │  │  │ │  │
     │                       │   │  │  │  │  │ mail-service :8083   │  │  │  │ │  │
     │                       │   │  │  │  │  │ master-service :8085  │  │  │  │ │  │
     │                       │   │  │  │  └──────────────────────┘  │  │  │  │ │  │
     │                       │   │  │  │  Cloud Map Service Discovery│  │  │  │ │  │
     │                       │   │  │  └────────────────────────────┘  │  │  │ │  │
     │                       │   │  │                                  │  │  │ │  │
     │                       │   │  │  ┌────────────────────────────┐  │  │  │ │  │
     │                       │   │  │  │  RDS PostgreSQL 16         │  │  │  │ │  │
     │                       │   │  │  │  T3.MICRO, Single-AZ        │  │  │  │ │  │
     │                       │   │  │  │  Database: awsmicrodemo     │  │  │  │ │  │
     │                       │   │  │  └────────────────────────────┘  │  │  │ │  │
     │                       │   │  └──────────────────────────────────┘  │ │  │
     │                       │   │  └─────────────────────────────────────┘  │  │
     │                       │   └───────────────────────────────────────────┘  │
     │                       │                                                     │
     │                       └─────────────────────────────────────────────────┘  │
                              │                                                     │
                              └─────────────────────────────────────────────────────┘

                                    FULL REQUEST FLOW (DETAILED)
                                    ============================

  ① Browser                    ② CloudFront                    ③ API Gateway HTTP API
  ───────────                   ──────────────                  ──────────────────────
  GET /api/members
  Host: api.xxx.com
  Authorization: Bearer <JWT>

                                     │
                                     ▼
                         ┌─────────────────────────┐
                         │   CloudFront            │
                         │   Cache: /api/*          │  ◄── Static assets cached
                         │   SSL Termination        │      at edge locations
                         │   WAF (optional)         │
                         └────────────┬────────────┘
                                      │
                                      ▼ (cache miss / dynamic request)
                         ┌─────────────────────────┐
                         │   API Gateway           │
                         │   HTTP API (v2)         │  ◄── JWT Authorizer
                         │   Route: /{proxy+}       │      validates Cognito
                         │   VPC Link ──────────┐   │
                         └────────────┬────────┘   │
                                      │            │
                                      ▼            │  (internal traffic)
                         ┌─────────────────────────┐ │
                         │   NLB (Internal)         │ │
                         │   TCP on ports           │ │
                         │   8081-8085              │ │
                         │   Security Group: nlbSg │ │
                         └────────────┬────────────┘ │
                                      │              │
                  ┌───────────────────┼──────────────┘
                  │                   │
        ┌─────────┴────┐   ┌─────────┴────┐
        │ 8084 → auth  │   │ 8081 → member │
        │ 8082 → file  │   │ 8083 → mail   │
        │ 8085 → master │   └───────────────┘
        └───────────────┘

  ④ ECS Fargate Task ──────────── ⑤ Internal Service Calls ──────────── ⑥ AWS Services
  ──────────────────                ──────────────────────────           ──────────────
  auth-service:8084
    │
    ├─► Cognito (JWT validation, user lookup)
    │
    ├─► RDS (user table CRUD)
    │
    └─► Secrets Manager (DB credentials)
                                     ⑦ S3 Storage
                                     ─────────────
  file-service:8082
    │
    ├─► S3 (upload/download/delete files)
    │     Bucket: aws-micro-demo-storage-production
    │
    ├─► SNS (publish FILE_UPLOADED event)
    │     Topic: aws-micro-demo-file-events
    │       │
    │       ├─► SQS (aws-micro-demo-file-processing-queue)
    │       └─► SQS (aws-micro-demo-mail-queue)  ──► mail-service
    │
    ├─► RDS (file metadata)
    │
    └─► Secrets Manager

  member-service:8081
    │
    ├─► SNS (publish MEMBER_CREATED event)
    │     Topic: aws-micro-demo-member-events
    │       │
    │       ├─► SQS (aws-micro-demo-member-event-queue)
    │       └─► SQS (aws-micro-demo-mail-queue)  ──► mail-service
    │
    ├─► SQS (send audit log)
    │
    ├─► RDS (member CRUD)
    │
    └─► Secrets Manager

  mail-service:8083
    │
    ├─► SQS (poll mail queue continuously)
    │
    ├─► SNS (send notifications)
    │
    └─► Secrets Manager

  master-service:8085  (Orchestrator)
    │
    ├─► Internal HTTP calls via API Gateway
    │     ├─► member-service.service.local:8081
    │     └─► file-service.service.local:8082
    │
    ├─► RDS
    │
    └─► Secrets Manager
```

---

## 2. Infrastructure Chi Tiết

### 2.1 VPC Architecture

```
VPC: aws-micro-demo-vpc-<env>
CIDR: 10.0.0.0/16
AZs:  ap-southeast-1a, ap-southeast-1b
NAT Gateway: 1 (shared, cost-saving)

┌─────────────────────────────────────────────────────────────────┐
│                         VPC (10.0.0.0/16)                       │
│                                                                 │
│  PUBLIC SUBNETS (Internet-facing)          PRIVATE SUBNETS      │
│  ┌─────────────────────┐                  ┌─────────────────┐   │
│  │ 10.0.0.0/24  (AZ-a) │                  │ 10.0.2.0/24      │   │
│  │ • NAT Gateway       │ ◄── egress ──►  │ (AZ-a)          │   │
│  │ • Internet Gateway  │                  │                 │   │
│  │ • ALB/NLB (future)  │                  │ • ECS Tasks     │   │
│  └─────────────────────┘                  │ • RDS           │   │
│  ┌─────────────────────┐                  │ • Secrets Mgr  │   │
│  │ 10.0.1.0/24  (AZ-b) │                  └─────────────────┘   │
│  └─────────────────────┘                  ┌─────────────────┐   │
│                                           │ 10.0.3.0/24     │   │
│                                           │ (AZ-b)          │   │
│                                           └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Security Groups (4 cái):**

| Security Group | Name | Mô tả | Inbound Rules |
|---|---|---|---|
| `nlbSg` | NLB SG | Network Load Balancer | TCP from VPC CIDR (all ports) |
| `ecsSg` | ECS SG | Fargate tasks | TCP from `nlbSg` on ports 8081-8085 |
| `rdsSg` | RDS SG | PostgreSQL | TCP from `ecsSg` on port 5432 |
| `ecsSg` (shared) | ECS SG | — | All outbound allowed |

---

### 2.2 RDS PostgreSQL

```typescript
// rds-stack.ts
DatabaseInstance: aws-micro-demo-db-<env>
├── Engine: PostgreSQL 16
├── Instance: T3.MICRO         // ⚠️ dev only — production nên dùng T3.SMALL+
├── Storage: 20 GB, encrypted
├── Multi-AZ: false            // ⚠️ production nên bật
├── Backup: 1 day retention
├── DeletionProtection: false  // ⚠️ production nên true
│
├── Credentials: Secrets Manager
│   Secret Name: /aws-micro-demo/<env>/rds-credentials
│   Fields: { username: 'adminuser', password: '<auto-generated>' }
│
└── Endpoint: aws-micro-demo-db-<env>.c7sgmkocq132.ap-southeast-1.rds.amazonaws.com
    Port: 5432
    Database: awsmicrodemo        // Tất cả service dùng chung 1 DB
```

> **Lưu ý:** Hiện tại dùng 1 database `awsmicrodemo` cho tất cả service. Các service phân biệt bằng **schema** hoặc **table prefix**.

---

### 2.3 ECS Fargate Cluster

```
ECS Cluster: aws-micro-demo-<env>
├── Container Insights: ENABLED
├── Cloud Map Namespace: service.local (private DNS)
│
└── Services (5 cái, mỗi cái 1 task)

  ┌─────────────────────────────────────────────────────────────────┐
  │  Service: auth-service-<env>   Desired: 1  Port: 8084          │
  │  ┌───────────────────────────────────────────────────────────┐  │
  │  │ Task Definition: aws-micro-demo-auth-service-<env>:N     │  │
  │  │ CPU: 256 (0.25 vCPU)     Memory: 512 MB                   │  │
  │  │                                                             │  │
  │  │ Container: auth-service                                     │  │
  │  │ • Image: <ECR repo>/auth-service:latest                   │  │
  │  │ • Port: 8084 TCP                                          │  │
  │  │ • LogGroup: /ecs/aws-micro-demo/<env>/auth-service        │  │
  │  │                                                             │  │
  │  │ Environment Variables:                                      │  │
  │  │   SPRING_PROFILES_ACTIVE = production                      │  │
  │  │   SERVER_PORT = 8084                                        │  │
  │  │   DB_HOST = <RDS endpoint>                                  │  │
  │  │   DB_NAME = awsmicrodemo                                    │  │
  │  │   AWS_REGION = ap-southeast-1                               │  │
  │  │   AWS_COGNITO_USER_POOL_ID = <ARN>                         │  │
  │  │   AWS_COGNITO_CLIENT_ID = <ARN>                            │  │
  │  │                                                             │  │
  │  │ Secrets (from Secrets Manager):                            │  │
  │  │   DB_PASSWORD = from rds-credentials secret                │  │
  │  │   DB_USERNAME = from rds-credentials secret                │  │
  │  │   JWT_SECRET = from jwt-secret secret                      │  │
  │  │                                                             │  │
  │  │ IAM Roles:                                                 │  │
  │  │   Task Role: auth-service-task-role-<env>                  │  │
  │  │     • cognito-idp:* (admin operations)                     │  │
  │  │     • secretsmanager:GetSecretValue                        │  │
  │  │   Execution Role: auth-service-execution-role-<env>        │  │
  │  │     • AmazonECSTaskExecutionRolePolicy                    │  │
  │  │     • secretsmanager:GetSecretValue (for env injection)   │  │
  │  └───────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────┘

  (Tương tự cho: member-service :8081, file-service :8082,
                 mail-service :8083, master-service :8085)
```

**Network Target Group Health Check (tất cả service):**

```yaml
Protocol: TCP
Port: <service-port>
Interval: 60 seconds        # đã fix: trước là 30s
Healthy Threshold: 2
Unhealthy Threshold: 3      # đã fix: trước là 2
Timeout: 5 seconds
```

**Service Health Check Grace Period:**
```yaml
healthCheckGracePeriod: 120 seconds  # đã fix: trước không có
# Cho container 2 phút để start hoàn toàn trước khi ECS đánh giá health
```

---

### 2.4 IAM Roles Chi Tiết

#### Task Role vs Execution Role — Phân biệt

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│       TASK ROLE                 │     │      EXECUTION ROLE              │
│   (ecs-tasks.amazonaws.com)     │     │   (ecs-tasks.amazonaws.com)     │
│                                 │     │                                 │
│ Chạy KHI APP đang chạy          │     │ Chạy KHI CONTAINER ĐANG KHỞI    │
│ Dùng để gọi AWS services        │     │ Dùng để PULL image + INJECT env │
│ fromCredentialProviders()        │     │ fromSecretsManager()            │
└─────────────────────────────────┘     └─────────────────────────────────┘

Ví dụ: App cần gọi S3
  → Task Role có s3:PutObject        ✓
  → Execution Role KHÔNG cần S3      ✓

Ví dụ: Container cần DB credentials
  → Execution Role cần secretsmanager:GetSecretValue  ✓
  → Task Role cũng cần secretsmanager:GetSecretValue ✓
```

#### Chi tiết từng Service

**auth-service-task-role-\<env\>**
```json
{
  "cognito-idp:AdminInitiateAuth",
  "cognito-idp:AdminGetUser",
  "cognito-idp:SignUp",
  "cognito-idp:ConfirmSignUp",
  "cognito-idp:InitiateAuth",
  "cognito-idp:RespondToAuthChallenge",
  "cognito-idp:GetUser",
  "cognito-idp:GlobalSignOut",
  "cognito-idp:ListUsers",
  "secretsmanager:GetSecretValue",
  "secretsmanager:DescribeSecret"
}
```

**file-service-task-role-\<env\>**
```json
{
  "s3:PutObject", "s3:GetObject", "s3:DeleteObject",
  "s3:ListBucket", "s3:GetBucketLocation",
  "s3:AbortMultipartUpload", "s3:ListMultipartUploadParts",
  "sns:Publish", "sns:CreateTopic", "sns:GetTopicAttributes",
  "secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"
}
```

**member-service-task-role-\<env\>**
```json
{
  "sns:Publish", "sns:CreateTopic", "sns:GetTopicAttributes",
  "sqs:SendMessage", "sqs:SendMessageBatch",
  "sqs:GetQueueUrl", "sqs:GetQueueAttributes",
  "secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"
}
```

**mail-service-task-role-\<env\>**
```json
{
  "sqs:ReceiveMessage", "sqs:DeleteMessage",
  "sqs:GetQueueUrl", "sqs:GetQueueAttributes", "sqs:ListQueues",
  "sns:Publish", "sns:GetTopicAttributes"
}
```

**master-service-task-role-\<env\>**
```json
{
  "secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret",
  "execute-api:Invoke", "execute-api:ManageConnections"
  // (wildcard ARN: arn:aws:execute-api:*:*:api/*/*/*)
}
```

---

### 2.5 SNS / SQS — Event Flow Chi Tiết

```
                    SNS Topics                                    SQS Queues
                    ──────────                                    ───────────
  member-events-topic ──────► member-event-queue
     (MEMBER_CREATED)          (for member-service audit)         ▲
                              DLQ: member-event-dlq (14d)         │
                                                                 │
  file-events-topic ─────────► file-processing-queue             │
     (FILE_UPLOADED)            (for future async processing)     │
                              DLQ: file-processing-dlq (14d)      │
                                                                 │
  file-events-topic ─────────► mail-queue ──────────► mail-service (polling)
     (FILE_UPLOADED)          DLQ: mail-dlq (14d)         │
  member-events-topic ───────► (filtered)                         │
     (MEMBER_CREATED)                                         │
                                                              │
                    SNS:NotificationsTopic                     │
                    (for general notifications)               │
                                                              │
┌─────────────────────────────────────────────────────────────┐
│ Filter Policy trên mail-queue subscription:                 │
│                                                             │
│   eventType IN ['MEMBER_CREATED', 'FILE_UPLOADED']          │
│                                                             │
│ → Chỉ 2 loại event mới được forward vào mail-queue          │
└─────────────────────────────────────────────────────────────┘

Queue Configuration:
├── Visibility Timeout: 300s (5 phút)
│   → Message invisible trong 5 phút sau khi receive
│   → Nếu không delete → message tự động visible lại (retry)
├── Dead Letter Queue: khi receive > 3 lần không delete
├── Retention: 14 days (DLQ), 4 days (main queue)
└── Encryption: SSE-SQS (server-side, managed key)
```

---

### 2.6 S3 Storage

```
Bucket: aws-micro-demo-storage-<env>-<account-id>
├── Region: ap-southeast-1
├── Encrypted: AES-256 (SSE-S3)
├── Versioning: ENABLED
├── Public Access: BLOCKED
│
├── Policies:
│   └── Chỉ file-service task role được phép access
│       s3:PutObject, s3:GetObject, s3:DeleteObject
│       (resources: bucket ARN + bucket/*)
│
└── Use Cases:
    ├── file-service upload/download/delete
    └── Possible future: static assets, user uploads
```

---

### 2.7 Cognito User Pool

```
User Pool: aws-micro-demo-user-pool-<env>
├── Auto-verified attributes: email
├── Password policy: default (8+ chars)
├── MFA: OFF (có thể bật TOTP sau)
│
├── App Client: aws-micro-demo-app-client-<env>
│   ├── Auth flows: ALLOW_USER_PASSWORD_AUTH
│   │              ALLOW_REFRESH_TOKEN_AUTH
│   │              ALLOW_USER_SRP_AUTH
│   └── OAuth flows: authorization_code_grant
│
└── Outputs cho ECS:
    User Pool ARN → auth-service IAM (cognito-idp:*)
    User Pool ID  → env AWS_COGNITO_USER_POOL_ID
    Client ID     → env AWS_COGNITO_CLIENT_ID
```

---

### 2.8 API Gateway HTTP API + NLB + VPC Link

```
Request Flow:
Browser
   │
   ▼
CloudFront (HTTPS)
   │
   ▼
API Gateway HTTP API
   │
   ├── JWT Authorizer (Cognito)
   │    └─► Validate Bearer token
   │
   ▼
VPC Link: aws-micro-demo-vpclink
   │
   ▼
NLB (Internal, no public IP)
   ├── Port 8084 → auth-service target group
   ├── Port 8081 → member-service target group
   ├── Port 8082 → file-service target group
   ├── Port 8083 → mail-service target group
   └── Port 8085 → master-service target group
   │
   ▼
ECS Fargate Tasks

┌────────────────────────────────────────────────────────────────┐
│ NLB Security Group (nlbSg):                                   │
│   Inbound: TCP from VPC CIDR (10.0.0.0/16) on all ports        │
│   Outbound: all allowed                                       │
│                                                                │
│ ECS Security Group (ecsSg):                                    │
│   Inbound: TCP from nlbSg on ports 8081-8085                   │
│   Outbound: all allowed                                       │
└────────────────────────────────────────────────────────────────┘
```

---

### 2.9 CloudFront Distribution

```
CloudFront: aws-micro-demo-cloudfront-<env>
├── Origin: API Gateway HTTP API
│   Domain: <api-id>.execute-api.ap-southeast-1.amazonaws.com
│
├── Cache Policy:
│   ├── /api/* → CacheDisabled (always forward to origin)
│   └── /static/* → CacheEnabled (TTL 86400s)
│
├── Viewer Policy:
│   ├── HTTPS Only
│   └── TLS 1.2 minimum
│
├── Behaviours:
│   ├── /api/* → api-gateway origin, no cache, JWT passthrough
│   └── /* → custom error (if needed)
│
└── Outputs:
    Domain: dxxxxx.cloudfront.net
    ARN → CNAME record trong Route53 (api.xxx.com)
```

---

### 2.10 Secrets Manager — Tất Cả Secrets

| Secret Name | Store | Fields | Used By |
|---|---|---|---|
| `/aws-micro-demo/<env>/rds-credentials` | Auto-generated | `username`, `password` | Tất cả 5 service (task + execution role) |
| `/aws-micro-demo/<env>/jwt-secret` | CDK generated | `secret` (64 chars) | auth-service |

> **Lưu ý:** Hiện tại execution role dùng `resources: "*"` để đọc secrets. Nên restrict về ARN cụ thể trong production.

---

### 2.11 CDK Stack Dependency Graph

```
Deploy Order (theo addDependency):
═════════════════════════════════════════════════════════════

Phase 1: Foundation (không có dependency)
├── VpcStack          ← VPC, subnets, NAT Gateway, 3 Security Groups
├── SnsSqsStack       ← 3 SNS topics + 3 SQS queues + 3 DLQs
└── EcrStack         ← 5 ECR repositories (empty, chờ push image)

Phase 2: Persistence
└── RdsStack         ← RDS PostgreSQL 16, Secrets Manager credentials

Phase 3: Auth & Storage
├── CognitoStack     ← User Pool + App Client
└── S3Stack          ← Storage bucket

Phase 4: ECS (cần tất cả trên)
└── EcsStack         ← Cluster + 5 Services + NLB + Target Groups

Phase 5: API Gateway
└── ApiGatewayNlbStack ← HTTP API + VPC Link + Routes

Phase 6: CDN
└── CloudFrontStack  ← CloudFront distribution

Phase 7: Observability
└── CloudWatchStack  ← Alarms, dashboards (nếu có CloudWatch)
```

---

## 3. Scalability & Best Practices

### 3.1 Khi Hệ Thống Lớn Hơn

#### Vấn đề hiện tại & giới hạn

| Thành phần | Hiện tại | Giới hạn khi scale |
|---|---|---|
| RDS | T3.MICRO, Single-AZ | CPU 100%, IOPS giới hạn, failover chậm |
| ECS CPU/Memory | 256 CPU / 512 MB | Quá nhỏ cho Spring Boot nặng |
| ECS desiredCount | 1 task/service | Single point of failure |
| NAT Gateway | 1 cái | Bottleneck khi nhiều AZ |
| Health check | 60s interval | Chậm phát hiện unhealthy |

#### Roadmap Scale

```
Tier 1: Quick Wins (1-2 tuần)
──────────────────────────────────────────────────────────────────
  • Tăng ECS: 256 CPU → 512 CPU, 512 MB → 1024 MB
  • Tăng RDS: T3.MICRO → T3.SMALL
  • Bật Multi-AZ cho RDS
  • Tăng desiredCount: 1 → 2 (auto-scaling sau)

  # ecs-stack.ts
  cpu: 512,
  memoryLimitMiB: 1024,
  desiredCount: 2,

Tier 2: Auto Scaling (2-4 tuần)
──────────────────────────────────────────────────────────────────
  • ECS Service Auto Scaling
    ├── Min: 2, Max: 10
    ├── Scale on: CPU > 70%, Memory > 80%
    │   → Target tracking: CPUUtilization 70
    │
  • RDS: Read Replicas (1-2 cái)
    └── Cập nhật reader endpoint cho read-heavy queries

Tier 3: Architecture Refactor (1-2 tháng)
──────────────────────────────────────────────────────────────────
  • Tách mail-service thành Lambda (event-driven, scale=0)
  • Tách file-service: S3 presigned URLs, Lambda trigger
  • Thêm ElastiCache Redis cho session/cache
  • Thêm Elasticsearch cho search (thay full-scan DB)
  • Implement circuit breaker cho inter-service calls

Tier 4: Production Hardening (2-3 tháng)
──────────────────────────────────────────────────────────────────
  • RDS: T3 → M6G (ARM, better price/performance)
  • Multi-AZ NAT Gateways
  • VPC: Tăng subnet CIDR, thêm Transit Gateway
  • Thêm WAF + Shield cho CloudFront
  • Implement observability: X-Ray, canary deployments
```

---

### 3.2 Refactor Best Practices

#### 1. Database Schema Strategy

```
Hiện tại (1 database chung):
awsmicrodemo/
  ├── users (auth-service)
  ├── members (member-service)
  ├── files (file-service)
  ├── mail_logs (mail-service)
  └── audits (member-service)

Nên refactor thành:
awsmicrodemo/
  ├── auth_schema     (auth-service)
  ├── member_schema   (member-service)
  ├── file_schema     (file-service)
  ├── mail_schema     (mail-service)
  └── master_schema   (master-service)

# Mỗi service chỉ access schema của mình:
spring:
  jpa:
    properties:
      hibernate:
        default_schema: auth_schema
```

#### 2. Inter-Service Communication

```
Hiện tại (sync HTTP call):
master-service ──HTTP──► member-service (Cloud Map DNS)
                       └──► file-service (Cloud Map DNS)

⚠️ Problem: Tight coupling, cascade failure

Nên refactor (async event-driven):
master-service ──SNS──► member-events-topic ──SQS──► member-service
              └──SNS──► file-events-topic   ──SQS──► file-service

master-service chỉ publish event, không blocking chờ response.
```

#### 3. secretsmanager:Restrict wildcard → specific ARN

```typescript
// ⚠️ Hiện tại (dùng wildcard)
resources: ['*']

// ✅ Nên đổi thành
executionRole.addToPolicy(
  new iam.PolicyStatement({
    actions: ['secretsmanager:GetSecretValue'],
    resources: [dbSecretArn],  // ← specific ARN
  })
);
```

#### 4. Health Check — Nên dùng Application-level

```
Hiện tại (TCP health check):
NLB ──TCP──► port 8084
  └─► Container nhận packet nhưng app có thể đang fail

✅ Nên đổi (HTTP health check):
NLB ──HTTP GET /actuator/health──► app
  └─► App trả 200 chỉ khi DB connected + ready
```

```typescript
// ecs-stack.ts — đổi health check
healthCheck: {
  protocol: elbv2.Protocol.HTTP,
  path: '/actuator/health',
  port: String(svcDef.port),
  interval: cdk.Duration.seconds(30),
  healthyThresholdCount: 2,
  unhealthyThresholdCount: 3,
}
```

#### 5. CI/CD Pipeline

```yaml
# Tích hợp CodePipeline cho auto-deploy
Pipeline:
  Source: CodeCommit (main branch)
    ↓
  Build: CodeBuild
    ├── mvn package / gradle build
    ├── Docker build & push to ECR (tag: git-commit-hash)
    └── cdk diff --exclusively
    ↓
  Deploy: CodeDeploy
    ├── ECS Blue/Green deployment
    ├── Run tests trong new task
    └── Traffic shift 10% → 100%
    ↓
  Approve (manual gate)
    ↓
  Post-deploy: smoke test → CloudWatch alarms
```

#### 6. Observability Stack

```
Hiện tại: Container Insights (basic metrics)
Nên thêm:

┌──────────────────────────────────────────────────────────────┐
│                    Observability Stack                       │
│                                                              │
│  Traces (X-Ray)                                              │
│  └── Mỗi request: CloudFront → API GW → ECS → DB/S3/SQS     │
│      → Full distributed trace với latency per hop           │
│                                                              │
│  Metrics (CloudWatch + Grafana)                             │
│  ├── ECS: CPU, Memory, RunningTaskCount                     │
│  ├── RDS: CPU, Connections, BufferCacheHitRatio             │
│  ├── ALB/NLB: RequestCount, TargetResponseTime             │
│  └── Custom: Business metrics (orders, uploads)             │
│                                                              │
│  Logs (CloudWatch + OpenSearch)                             │
│  ├── ECS: /ecs/... log groups                              │
│  ├── Structured JSON logs (Spring Boot)                     │
│  └── OpenSearch → Kibana/Grafana dashboards                │
│                                                              │
│  Alarms                                                     │
│  ├── ECS: ServiceLatency > 2s                              │
│  ├── RDS: CPU > 80%, Storage < 20%                         │
│  ├── Queue: ApproximateNumberOfMessagesVisible > threshold │
│  └── Dead Letter Queue: any message = CRITICAL             │
│                                                              │
│  Dashboards                                                  │
│  ├── System Overview (all services)                         │
│  ├── Per-service drilldown                                  │
│  └── Business KPIs                                          │
└──────────────────────────────────────────────────────────────┘
```

---

### 3.3 Security Best Practices Checklist

```markdown
## Pre-production Security Checklist

### IAM
- [ ] Execution roles: resources: '*' → specific ARN
- [ ] Task roles: principle of least privilege
- [ ] Không dùng IAM user access key trong code
- [ ] Enable MFA cho tất cả IAM users

### Network
- [ ] RDS: bật deletionProtection
- [ ] NLB: không public IP (đã đúng)
- [ ] Security Group: restrict inbound to specific sources
- [ ] VPC Flow Logs: bật để audit traffic

### Secrets
- [ ] Secrets Manager: bật automatic rotation
- [ ] Không commit secrets/credentials vào code
- [ ] Dùng AWS Secrets Engine (Vault) nếu nhiều secrets

### Data
- [ ] RDS: bật encryption at rest (đã đúng)
- [ ] S3: bật encryption (đã đúng)
- [ ] S3: versioning enabled (đã đúng)
- [ ] RDS: bật automated backup (đã đúng, 1 ngày)
- [ ] RDS: tăng backup retention → 7 days

### Container
- [ ] Không chạy container as root
- [ ] Image scan trong ECR (enabled)
- [ ] Không dùng :latest tag trong production
- [ ] Non-root user in Dockerfile

### Compliance
- [ ] CloudTrail: bật để audit API calls
- [ ] Config Rules: để enforce compliance
- [ ] GuardDuty: threat detection
```

---

### 3.4 Cost Optimization

```markdown
## Cost Optimization Quick Wins

| Thành phần | Hiện tại | Chi phí/tháng (ước tính) | Tối ưu |
|---|---|---|---|
| NAT Gateway | 1 cái | ~$32 | Tái dùng, hoặc VPC Endpoints |
| RDS T3.MICRO | 1 cái | ~$15 | T3.SMALL khi production |
| ECS (5 tasks) | 256/512 | ~$15 | Tăng tài nguyên nhưng dùng reserved |
| S3 Storage | < 10GB | ~$0.25 | Intelligent Tiering |
| Secrets Manager | 2 secrets | ~$0.10 | — |
| CloudFront | 1 dist | ~$5-20 | Cache hit ratio |
| API Gateway | HTTP API | ~$1-5 | Cache responses |

## Reserved Instance / Savings Plans
- RDS: 1-year Reserved → tiết kiệm 40%
- ECS: Compute Savings Plan → tiết kiệm 30-50%
- Nên mua khi workload ổn định > 3 tháng

## Free Tier充分利用
- CloudFront: 1TB transfer + 10M requests/tháng (free)
- API Gateway: 1M requests/tháng (free)
- Lambda: 1M requests + 400K GB-seconds (free)
→ mail-service có thể chuyển sang Lambda (scale=0, tiết kiệm)
```

---

## 4. Quick Reference — Common Commands

```bash
# Deploy infrastructure
cdk deploy --all

# Xem diff trước deploy
cdk diff

# Force update ECS service
aws ecs update-service \
  --cluster aws-micro-demo-production \
  --service file-service-production \
  --force-new-deployment

# Disable service (stop loop)
aws ecs update-service \
  --cluster aws-micro-demo-production \
  --service file-service-production \
  --desired-count 0

# Run task thủ công (debug)
aws ecs run-task \
  --cluster aws-micro-demo-production \
  --task-definition aws-micro-demo-file-service-production:3 \
  --overrides '{"containerOverrides":[{"name":"file-service","command":["sleep","600"]}]}'

# Exec vào container
aws ecs execute-command \
  --cluster aws-micro-demo-production \
  --task <task-id> \
  --container file-service \
  --interactive --command "/bin/sh"

# Xem task logs (nếu CloudWatch đã deploy)
aws logs tail /ecs/aws-micro-demo/production/file-service --follow

# Kiểm tra RDS secret
aws secretsmanager get-secret-value \
  --secret-id /aws-micro-demo/production/rds-credentials

# Kiểm tra RDS status
aws rds describe-db-instances \
  --db-instance-identifier aws-micro-demo-db-production \
  --query 'DBInstances[0].{Status:DBInstanceStatus}'

# IAM policy simulation
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::506870089020:role/file-service-execution-role-production \
  --action-names secretsmanager:GetSecretValue \
  --resource-arns /aws-micro-demo/production/rds-credentials

# Xóa toàn bộ stack
cdk destroy --all
```
