# Infrastructure Setup Guide — Senior DevOps Playbook

> **Mục tiêu:** Hệ thống từ zero → production-ready, theo đúng thứ tự, với best practice.
> **Tác giả:** Senior DevOps mindset
> **Áp dụng cho:** Toàn bộ monorepo `aws/` — 5 services + frontend + infrastructure (CDK)

---

## Table of Contents

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Phần 0 — Chuẩn bị tài khoản & Identity](#2-phần-0--chuẩn-bị-tài-khoản--identity)
3. [Phần 1 — Foundation (IaC trước)](#3-phần-1--foundation-iac-trước)
4. [Phần 2 — IaC cho từng AWS service](#4-phần-2--iac-cho-từng-aws-service)
5. [Phần 3 — Local Development Environment](#5-phần-3--local-development-environment)
6. [Phần 4 — CI/CD Pipeline](#6-phần-4--cicd-pipeline)
7. [Phần 5 — Staging & Production](#7-phần-5--staging--production)
8. [Phần 6 — Observability & Security](#8-phần-6--observability--security)
9. [Phần 7 — Deployment Flow (Local → Staging → Prod)](#9-phần-7--deployment-flow-local--staging--prod)
10. [Checklist tổng hợp](#10-checklist-tổng-hợp)
11. [CDK Quick Reference](#11-cdk-quick-reference)

---

## 1. Tổng quan hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                        End Users                            │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   CloudFront (CDN)                          │
│            Static assets (Frontend S3)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ /api/*
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway + Cognito (Auth)                   │
│         member-service, file-service, master-service         │
└─────────────────────┬───────────────────────────────────────┘
                      │ Internal VPC traffic (NLB)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    ECS Fargate Cluster                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  member  │ │   file   │ │   mail   │ │  master  │     │
│  │service   │ │ service  │ │ service  │ │ service  │     │
│  │  :8081   │ │  :8082   │ │  :8083   │ │  :8085   │     │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘     │
│       │             │            │                         │
│       └──────────┬──┴────────────┘                         │
│                  ▼                                          │
│           ┌─────────────┐    ┌─────────────┐               │
│           │  RDS (RDS)  │    │ Secrets Mgr │               │
│           │ PostgreSQL 15│    │ Credentials │               │
│           └─────────────┘    └─────────────┘               │
│                  │                                          │
│                  ▼                                          │
│     ┌────────────┴──────────────┐                          │
│     │  SNS Topics ──► SQS Queues│                          │
│     │  (member-events)          │                          │
│     │  (file-events)            │                          │
│     │  (notifications)          │                          │
│     └────────────┬──────────────┘                          │
│                  ▼                                          │
│     ┌────────────┴──────────────┐                          │
│     │         SES (Email)         │                          │
│     │       mail-service         │                          │
│     └────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Services & AWS Dependencies

| Service | Port | Database | AWS Services | Message Events |
|---------|------|----------|--------------|---------------|
| **auth-service** | 8084 | `auth_db` | Cognito | — |
| **member-service** | 8081 | `member_db` | SNS (notifications), SQS (audit) | `MEMBER_CREATED` |
| **file-service** | 8082 | `file_db` | S3 (uploads), SNS (file-events) | `FILE_UPLOADED` |
| **mail-service** | 8083 | `mail_db` | SES, SQS (mail-queue) | Consumes from SQS |
| **master-service** | 8085 | `master_db` | — (orchestrator) | — |
| **frontend** | 3000 | — | CloudFront, S3 (static) | — |

---

## 2. Phần 0 — Chuẩn bị tài khoản & Identity

> **Mục tiêu:** Setup 2 AWS environments — `dev` và `prod` — đủ để develop + deploy production-ready.
> **Giả định:** Bạn có 1 AWS account, dùng SSO profiles để tách dev/prod trong cùng account.
> **Thời gian ước tính:** 30–60 phút (lần đầu), 15 phút cho mỗi lần refresh credentials.

---

### 2.1 Tài khoản AWS — Chiến lược 2 environments

```
CÁCH 1: 1 AWS Account + SSO profiles (khuyến nghị cho bạn)
─────────────────────────────────────────────────────────
aws-account (123456789)
├── aws-dev profile    → resources có suffix:  -dev
└── aws-prod profile   → resources có suffix:  -prod

CÁCH 2: 2 AWS Accounts riêng biệt
─────────────────────────────────────────────────────────
aws-account-dev (111111111)
└── aws-dev profile    → dùng cho dev/staging

aws-account-prod (222222222)
└── aws-prod profile   → dùng cho production

→ Phức tạp hơn, cần IAM Role cross-account
→ Cần setup AWS Organizations trước
→ Chỉ dùng khi team > 5 người hoặc compliance yêu cầu
```

**Recommendation cho bạn:** Dùng **Cách 1** (1 account + SSO profiles).

---

### 2.2 Checklist trước khi bắt đầu

```
□ Có AWS account (đăng ký tại aws.amazon.com)
□ Email đã verify trong AWS (kiểm tra inbox)
□ Đăng nhập AWS Console được
□ Đã cài AWS CLI v2 (aws --version ≥ 2.x)
□ Đã cài Docker Desktop (docker --version)
□ Đã cài Maven hoặc IntelliJ IDEA
□ Thẻ credit/debit đã liên kết (AWS cần để xác minh)
```

**Kiểm tra AWS CLI:**
```bash
aws --version
# Output: aws-cli/2.x.x Python/3.x.x ...

aws configure list
# Nếu chưa config → chưa có credentials
```

---

### 2.3 Bước 1: Enable AWS IAM Identity Center (SSO)

> AWS IAM Identity Center = tên mới của "AWS SSO". Cùng 1 thứ, tên mới hay hơn.

**A. Enable SSO qua Console (bắt buộc làm 1 lần)**

```
1. Mở AWS Console
   https://console.aws.amazon.com

2. Search: "IAM Identity Center" hoặc "SSO"
   → Click vào "IAM Identity Center"

3. Click "Enable identity center"
   → Dùng "Built-in identity store" (đơn giản nhất)
   → Đừng chọn Active Directory (cần thêm setup)

4. Tạo Admin permission set
   → Click "Permission sets" → "Create permission set"
   → Name: "Administrator"
   → Permission set type: "Job function"
   → Policy: "AdministratorAccess" ← full quyền
   → Click "Create"

5. Assign admin cho user của bạn
   → Click "AWS accounts" → chọn account → "Assign users"
   → Chọn email của bạn → Assign
```

**B. Đăng nhập SSO lần đầu**

```
1. Mở email từ AWS: "You have access to AWS"
2. Click link trong email → mở SSO portal
3. Hoặc truy cập trực tiếp:
   https://your-account-id.awsapps.com/start
   (AWS sẽ gửi link này qua email sau khi enable)

4. Click "Management console" → vào AWS Console
   → Bạn đã có full access như admin
```

**C. Bật MFA (BẮT BUỘC — security best practice)**

```
1. AWS Console → IAM Identity Center → Users
2. Click vào user của bạn → "Send email to user"
3. User nhận email → set password + MFA

Hoặc tự set trên Console:
1. Click user name (góc phải trên) → "Security credentials"
2. Phần "Multi-factor authentication (MFA)" → "Assign MFA device"
3. Dùng app: Authenticator (iOS/Android) hoặc Google Authenticator
4. Quét QR code → nhập 2 mã liên tiếp từ app
5. ✅ MFA đã bật
```

---

### 2.4 Bước 2: Configure AWS CLI với SSO Profiles

Chạy trên máy local (Terminal / PowerShell):

**A. Configure SSO cho `dev` profile**

```bash
# Xóa config cũ nếu có (tránh xung đột)
aws configure sso

# AWS SSO start URL:
# Copy từ email AWS hoặc vào IAM Identity Center → Settings
# Ví dụ: https://d-xxxxxxxx.awsapps.com/start

# Làm theo wizard:
# ? SSO session name [1]: AWS-DevSession
# ? SSO start URL: https://d-xxxxxxxx.awsapps.com/start
# ? SSO region: ap-southeast-1
# ? SSO scopes [PRESS ENTER for default]:
# ? CLI default client Region [ap-southeast-1]:
# ? CLI default output format [json]:
# ? CLI profile name [AWSReservedSSO_...]: aws-dev

# Sau đó login:
aws sso login --profile aws-dev

# Nó sẽ mở trình duyệt → click "Allow"
# Terminal sẽ nhận credentials tạm
```

**B. Configure SSO cho `prod` profile**

```bash
aws configure sso --profile aws-prod

# ? SSO session name [1]: AWS-ProdSession
# ? SSO start URL: https://d-xxxxxxxx.awsapps.com/start
# ? SSO region: ap-southeast-1
# ? CLI default client Region [ap-southeast-1]:
# ? CLI default output format [json]:
# ? CLI profile name: aws-prod
```

**C. Verify credentials đang hoạt động**

```bash
# Kiểm tra dev profile
aws sts get-caller-identity --profile aws-dev

# Output mong đợi:
# {
#   "UserId": "AROAXXXXXXXX:aws-sso-provisioner",
#   "Account": "123456789",
#   "Arn": "arn:aws:sts::123456789:assumed-role/AWSReservedSSO_AdministratorAccess_xxxxx/your-email@example.com"
# }
```

---

### 2.5 Bước 3: IAM cho từng Service (CDK Explicit — Best Practice)

> **KHÔNG dùng `*` hay `AdministratorAccess` trong production.**
> **CDK tạo IAM tự động** — mỗi service có Task Role + Execution Role riêng, được định nghĩa rõ ràng trong code. Không cần tạo JSON policy rồi apply qua CLI.

**2 nguyên tắc IAM trong ECS Fargate:**

```
Task Role      — quyền SERVICE CẦN KHI CHẠY (gọi S3, SNS, DB...)
                → gắn vào task definition

Execution Role — quyền ECS CẦN ĐỂ BOOT (pull image, ghi logs)
                → gắn vào task definition
```

**Cấu trúc file IAM trong codebase:**

```
infra/lib/iam/
├── index.ts              ← barrel export tất cả hàm
├── auth-service-iam.ts   ← Task Role + Execution Role cho auth-service
├── member-service-iam.ts ← Task Role + Execution Role cho member-service
├── file-service-iam.ts   ← Task Role + Execution Role cho file-service
├── mail-service-iam.ts   ← Task Role + Execution Role cho mail-service
└── master-service-iam.ts ← Task Role + Execution Role cho master-service
```

**Ví dụ: auth-service IAM (`infra/lib/iam/auth-service-iam.ts`)**

```typescript
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface AuthServiceIAMProps {
  envName: string;
  userPoolArn: string;    // Cognito User Pool ARN
  dbSecretArn: string;    // Secrets Manager ARN
}

// ================================================
// Task Role — quyền khi service chạy
// ================================================
export function createAuthServiceIAM(
  scope: Construct,
  props: AuthServiceIAMProps
): iam.Role {
  const { envName, userPoolArn, dbSecretArn } = props;

  const taskRole = new iam.Role(scope, 'AuthServiceTaskRole', {
    roleName: `auth-service-task-role-${envName}`,
    description: 'Task role for auth-service ECS task',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });

  // Cognito — chỉ những action cần thiết, resource cụ thể
  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'CognitoAuth',
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminInitiateAuth',
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminConfirmSignUp',
        'cognito-idp:GlobalSignOut',
        'cognito-idp:ListUsers',
        'cognito-idp:SignUp',
        'cognito-idp:ConfirmSignUp',
        'cognito-idp:InitiateAuth',
        'cognito-idp:RespondToAuthChallenge',
        'cognito-idp:GetUser',
      ],
      resources: [userPoolArn],  // ✅ cụ thể, KHÔNG *
    })
  );

  // Secrets Manager — chỉ đọc DB credentials
  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SecretsManagerRead',
      effect: iam.Effect.ALLOW,
      actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
      resources: [dbSecretArn],
    })
  );

  return taskRole;
}

// ================================================
// Execution Role — pull image + ghi CloudWatch logs
// ================================================
export function createAuthServiceExecutionRole(
  scope: Construct,
  props: AuthServiceIAMProps
): iam.Role {
  const { envName } = props;

  const executionRole = new iam.Role(scope, 'AuthServiceExecutionRole', {
    roleName: `auth-service-execution-role-${envName}`,
    description: 'Execution role for auth-service ECS task',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AmazonECSTaskExecutionRolePolicy'
      ),
    ],
  });

  return executionRole;
}
```

**Cách gắn IAM vào ECS Task Definition:**

```typescript
// infra/lib/ecs-stack.ts

// 1. Tạo IAM roles cho auth-service
const authTaskRole    = createAuthServiceIAM(this, { envName, userPoolArn, dbSecretArn });
const authExecRole    = createAuthServiceExecutionRole(this, { envName });

// 2. Gắn vào task definition
const authTaskDef = new ecs.FargateTaskDefinition(this, 'AuthTaskDef', {
  family: `aws-micro-demo-auth-service-${envName}`,
  taskRole: authTaskRole,      // ✅ explicit
  executionRole: authExecRole, // ✅ explicit
  cpu: 256,
  memoryLimitMiB: 512,
});

// 3. Container vẫn dùng ECR image
const authContainer = authTaskDef.addContainer('AuthServiceContainer', {
  image: ecs.ContainerImage.fromEcrRepository(
    ecrRepositories['auth-service']
  ),
  portMappings: [{ containerPort: 8084 }],
  // secrets: DB credentials từ Secrets Manager
  secrets: {
    DB_PASSWORD: ecs.Secret.fromSecretsManager(dbCredentials, 'password'),
    DB_USER:    ecs.Secret.fromSecretsManager(dbCredentials, 'username'),
  },
});
```

**Tóm tắt: Ưu điểm CDK Explicit IAM**

| Tiêu chí | Implicit IAM (grantRead) | **Explicit IAM (addToPolicy)** |
|----------|--------------------------|--------------------------------|
| Đọc code | Khó hiểu (CDK sinh tự động) | **Rõ ràng, tường minh** |
| Review quyền | Phải synth rồi mới thấy | **Đọc thẳng TypeScript** |
| Debug | Khó trace | **Dễ trace — có sid, action, resource** |
| Thêm quyền | Phải biết CDK API | **Thêm `actions` vào array là xong** |
| Multi-env | Cần thêm CDK context | **`envName` suffix tự động** |

> **Không cần tạo `infra/policies/*.json` thủ công.** CDK quản lý IAM hoàn toàn qua code TypeScript. Mỗi khi deploy, CDK so sánh state mong muốn với AWS hiện tại và chỉ apply diff.

---

### 2.6 Bước 4: IAM Role cho GitHub Actions (CI/CD)

> Nếu bạn dùng GitHub Actions để deploy, cần tạo IAM Role để GitHub có thể assume.

**A. Tạo IAM Role cho GitHub Actions (AWS Console)**

```
1. AWS Console → IAM → Roles → Create role
2. Trusted entity type: "Custom trust policy"
3. Paste trust policy:

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<your-org>/*"
        }
      }
    }
  ]
}
```

**B. Attach policies cho GitHub Actions Role**

```
1. Sau khi tạo Role → Click "Add permissions" → "Attach policies directly"
2. Tìm và attach:
   - AmazonEC2ContainerRegistryReadOnly (ECR read)
   - AmazonECS_FullAccess (ECS deploy)
   - IAMReadOnlyAccess (CDK cần đọc IAM)
   - Policy đã tạo ở 2.5:
     - auth-service-policy
     - member-service-policy
     - file-service-policy
     - mail-service-policy

3. Policy inline cho CDK deploy (thêm vào role):
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "cloudformation:*",
           "cdk:*"
         ],
         "Resource": "*"
       }
     ]
   }
```

**C. Note GitHub Actions Role ARN**

```
Sau khi tạo role → copy ARN:
arn:aws:iam::123456789:role/github-actions-deploy

→ Paste vào GitHub repository Secrets:
  GitHub → Settings → Secrets and variables → Actions
  → New repository secret:
    Name: AWS_DEPLOY_ROLE_ARN
    Value: arn:aws:iam::123456789:role/github-actions-deploy
```

---

### 2.7 Bước 5: Cấu hình `infra/bin/app.ts` cho 2 environments

```typescript
// infra/bin/app.ts
import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();

// Lấy environment từ context
// Chạy: npx cdk deploy --context env=dev
// Hoặc: npx cdk deploy --context env=prod

const envContext = app.node.tryGetContext('env') || 'dev';

const targetEnv = {
  account: process.env.CDK_ACCOUNT_ID || '123456789',
  region: process.env.CDK_REGION || 'ap-southeast-1',
};

const envSuffix = envContext === 'prod' ? 'prod' : 'dev';
const isProd = envContext === 'prod';

// =====================================================
// VPC Stack — dùng chung cho cả dev và prod
// =====================================================
import { VpcStack } from '../lib/vpc-stack';
const vpcStack = new VpcStack(app, `aws-vpc-${envSuffix}`, {
  env: targetEnv,
  envSuffix,
  isProd,
});
cdk.Tags.of(vpcStack).add('Environment', envContext);

// =====================================================
// Cognito Stack
// =====================================================
import { CognitoStack } from '../lib/cognito-stack';
const cognitoStack = new CognitoStack(app, `aws-cognito-${envSuffix}`, {
  env: targetEnv,
  envSuffix,
  isProd,
});
cognitoStack.addDependency(vpcStack);

// =====================================================
// ... các stacks khác
// =====================================================

app.synth();
```

---

### 2.8 Bước 6: Cấu hình GitHub Secrets cho CI/CD

```
GitHub repository → Settings → Secrets and variables → Actions → New secret

SECRETS CẦN TẠO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name                      │ Giá trị
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AWS_ACCOUNT_ID            │ 123456789 (AWS Account ID)
AWS_REGION                │ ap-southeast-1
AWS_DEPLOY_ROLE_ARN       │ arn:aws:iam::123456789:role/github-actions-deploy
COGNITO_USER_POOL_ID_DEV  │ (sẽ set sau ở Phase 2)
COGNITO_CLIENT_ID_DEV     │ (sẽ set sau ở Phase 2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ KHÔNG đặt credentials thật (Access Key/Secret) vào GitHub Secrets.
  → Dùng IAM Role ARN + OIDC trust (bước 2.6) — bảo mật hơn nhiều.
```

---

### 2.9 Khi nào credentials hết hạn + cách renew

```
SSO credentials hết hạn sau khoảng 8–16 giờ (tùy AWS setup).

DẤU HIỆU HẾT HẠN:
  An error occurred (ExpiredTokenException) when calling the GetCallerIdentity operation:
  The security token included in the request is expired.

CÁCH RENEW:
  # Dev
  aws sso login --profile aws-dev

  # Prod
  aws sso login --profile aws-prod

Sau khi login lại → credentials mới được cache → tiếp tục làm việc.
```

---

### 2.10 Môi trường cần cho local development

| Resource | Local (Docker) | AWS Dev (SSO) | AWS Prod (SSO) |
|----------|---------------|---------------|----------------|
| Cognito | LocalStack | ✅ Real dev pool | ✅ Real prod pool |
| PostgreSQL | Docker compose | Docker / RDS | RDS |
| S3 | LocalStack | ✅ Real (dev bucket) | ✅ Real (prod bucket) |
| SNS/SQS | LocalStack | ✅ Real | ✅ Real |
| SES | Mailhog / LocalStack | ✅ Sandbox | ✅ Production (cần request) |
| Secrets | `.env` file (gitignored) | AWS Secrets Manager | AWS Secrets Manager |

---

### 2.11 Checklist Phase 0 — Đánh dấu khi hoàn thành

```
□ Có AWS account và đăng nhập Console được
□ Enable AWS IAM Identity Center (SSO)
□ Bật MFA cho root/user
□ aws sso login --profile aws-dev → thành công
□ aws sso login --profile aws-prod → thành công
□ aws sts get-caller-identity --profile aws-dev → có output
□ aws sts get-caller-identity --profile aws-prod → có output
□ Tạo được IAM policies (auth, member, file, mail)
□ Tạo được IAM Role cho GitHub Actions
□ Thêm GitHub Secrets (AWS_ACCOUNT_ID, AWS_DEPLOY_ROLE_ARN)
□ infra/bin/app.ts đã hỗ trợ --context env=dev/prod
□ Đã hiểu cách renew SSO credentials khi hết hạn

→ Xong Phase 0 → Sang Phase 1: Foundation (VPC, IAM, Secrets)
```

---

### 2.12 Troubleshooting Phase 0

| Lỗi | Nguyên nhân | Cách fix |
|-----|-------------|---------|
| `SSO session has expired` | SSO token hết hạn | `aws sso login --profile aws-dev` |
| `No profile named aws-dev` | Chưa chạy `aws configure sso` | `aws configure sso --profile aws-dev` |
| `is not a valid IAM entity type` | Trust policy sai format | Dùng JSON chuẩn như 2.6.A |
| `Access Denied` khi deploy | IAM role không đủ quyền | Attach thêm policy hoặc dùng `AdministratorAccess` tạm |
| MFA không hoạt động | Sai mã hoặc thời gian không sync | Kiểm tra đồng hồ device, quét QR lại |

---

## 3. Phần 1 — Foundation (IaC trước)

### 3.1 Thứ tự tạo infrastructure

```
Foundation là cái KHÔNG THỂ THIẾU cho mọi service.
Làm ĐẦU TIÊN, không ngoại lệ.
```

| Thứ tự | Resource | File CDK | Lý do |
|--------|----------|----------|--------|
| **1** | VPC + Subnets | `vpc-stack.ts` | Tất cả resource (RDS, ECS) nằm trong VPC |
| **2** | ECR Repositories | `ecr-stack.ts` | Build Docker image → push lên ECR → dùng ở ECS |
| **3** | Secrets Manager | *(trong rds-stack.ts)* | DB credentials phải có TRƯỚC khi tạo RDS |
| **4** | RDS PostgreSQL | `rds-stack.ts` | Database phải có trước khi service start |
| **5** | Cognito User Pool | `cognito-stack.ts` | Auth service cần pool ID |
| **6** | SNS + SQS | `sns-sqs-stack.ts` | Async messaging, services cần queue ARN |
| **7** | ECS Cluster + Tasks | `ecs-stack.ts` | Nơi chạy containers |
| **8** | S3 Buckets | `s3-stack.ts` | File uploads |
| **9** | CloudFront + API GW | `cloudfront-stack.ts` | Public entry point |
| **10** | CloudWatch Alarms | `cloudwatch-stack.ts` | Monitoring, nên làm sớm |

### 3.2 Bootstrap CDK (chạy 1 lần cho mỗi account)

```bash
cd infra

# ⚠️ Bước BẮT BUỘC trước khi deploy bất cứ CDK stack nào
# Bootstrap tạo S3 bucket + IAM roles cần cho CDK hoạt động

# Dev account
npx cdk bootstrap \
  --profile aws-dev \
  --context env=dev \
  aws://ACCOUNT_ID/ap-southeast-1

# Staging account
npx cdk bootstrap \
  --profile aws-staging \
  --context env=staging \
  aws://ACCOUNT_ID/ap-southeast-1

# Prod account
npx cdk bootstrap \
  --profile aws-prod \
  --context env=prod \
  aws://ACCOUNT_ID/ap-southeast-1
```

### 3.3 VPC Design — Best Practice

```typescript
// infra/lib/vpc-stack.ts — Production-grade VPC
const vpc = new ec2.Vpc(this, 'MainVPC', {
  vpcName: 'aws-vpc-dev',
  maxAzs: 2,                        // 2 AZs cho HA, tiết kiệm hơn 3
  cidr: '10.0.0.0/16',

  // Public subnets — NAT Gateway
  publicSubnetMask: 24,             // /24 mỗi AZ

  // Private subnets — ECS tasks, RDS
  privateSubnetMask: 24,            // /24 mỗi AZ

  // Isolated subnets — RDS only (không có internet)
  subnetConfiguration: [
    {
      cidrMask: 24,
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
    },
    {
      cidrMask: 24,
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      // Tự động tạo NAT Gateway cho outbound
    },
    {
      cidrMask: 28,
      name: 'Isolated',
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      // RDS nằm ở đây — không có internet
    },
  ],

  // NAT Gateways: 1 cho dev, 2 cho prod (HA)
  natGateways: 1,
});
```

### 3.4 RDS Design — Best Practice

```typescript
// infra/lib/rds-stack.ts

// 1. Secrets Manager — LƯU TRƯỚC credentials
const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
  secretName: `auth-service/db-credentials`,
  generateSecretString: {
    secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
    generateStringKey: 'password',
    passwordLength: 32,
    excludePunctuation: false,
  },
});

// 2. RDS Subnet Group — bắt buộc cho RDS trong VPC
const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
  subnetIds: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }).subnetIds,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

// 3. RDS PostgreSQL
const db = new rds.DatabaseInstance(this, 'PostgreSQL', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15_4,
  }),

  // instance class: t3.small = minimal cho dev, r6g.large cho prod
  instanceType: process.env.CDK_ENV === 'prod'
    ? ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE)
    : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),

  // Không để credentials trong code — dùng Secrets Manager
  credentials: rds.Credentials.fromSecret(dbCredentials),

  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },

  // Security Group: chỉ ECS được kết nối
  securityGroups: [ecsToDbSecurityGroup],

  // Multi-AZ cho prod, single-AZ cho dev
  multiAz: process.env.CDK_ENV === 'prod',
  allocatedStorage: 20,            // GB
  maxAllocatedStorage: 100,        // Storage auto-scaling
  backupRetention: cdk.Duration.days(
    process.env.CDK_ENV === 'prod' ? 30 : 7
  ),

  // Encryption at rest
  storageEncrypted: true,
  deletionProtection: process.env.CDK_ENV === 'prod', // ❌ Không xóa nhầm prod
  removalPolicy: process.env.CDK_ENV === 'prod'
    ? cdk.RemovalPolicy.RETAIN
    : cdk.RemovalPolicy.DESTROY,
});
```

### 3.5 IaC Development Workflow

```
1. Viết/điều chỉnh CDK code
       ↓
2. npx cdk synth --profile aws-dev
   → Generate CloudFormation template
   → Kiểm tra diff trước khi apply
       ↓
3. npx cdk diff --profile aws-dev
   → Xem CHÍNH XÁC thay đổi gì
       ↓
4. npx cdk deploy --profile aws-dev
   → Tạo/điều chỉnh AWS resources
       ↓
5. Verify → Kiểm tra AWS Console
       ↓
6. git commit → push
```

**⚠️ Nguyên tắc sắt đá:**
- `cdk diff` trước `cdk deploy` — không bao giờ deploy mà không xem diff
- `cdk destroy` để test destroy workflow — biết cách xóa sạch
- Mọi thay đổi phải qua PR review — không commit trực tiếp vào main

---

## 4. Phần 2 — IaC cho từng AWS Service

### 4.1 Cognito — Auth Service

```typescript
// infra/lib/cognito-stack.ts
const userPool = new cognito.UserPool(this, 'AuthUserPool', {
  userPoolName: `aws-auth-pool-${env}`,
  selfSignUpEnabled: true,                    // Dev: true, Prod: false
  signInAliases: {
    email: true,                              // Login bằng email
    username: false,
  },
  standardAttributes: {
    email: { required: true, mutable: false },
    fullname: { required: false, mutable: true },
  },
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireDigits: true,
    requireSymbols: true,
  },
  accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
  removalPolicy: cdk.RemovalPolicy.RETAIN,   // Prod: RETAIN, Dev: DESTROY
});

// App Client (không có secret — SPA/Mobile friendly)
const appClient = new cognito.UserPoolClient(this, 'AuthAppClient', {
  userPool,
  authFlows: {
    adminUserPassword: true,                 // ADMIN_NO_SRP_AUTH
    userPassword: true,
    refreshToken: true,
  },
  generateSecret: false,                      // ⚠️ Không generate secret
  supportedIdentityProviders: [
    cognito.UserPoolClientIdentityProvider.COGNITO,
  ],
  allowedOAuthFlows: ['code'],                // PKCE flow
  allowedOAuthScopes: [
    cognito.OAuthScope.OPENID,
    cognito.OAuthScope.EMAIL,
    cognito.OAuthScope.PROFILE,
  ],
  callbackUrls: env === 'prod'
    ? ['https://yourdomain.com/api/auth/callback']
    : ['http://localhost:8080/api/v1/auth/callback'],
});

// User Pool Domain
new cognito.UserPoolDomain(this, 'AuthDomain', {
  userPool,
  customDomain: {
    domainName: `auth-${env}.yourdomain.com`,
    certificate: acmCertificate,
  },
});

// Output: lấy giá trị cho service config
new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
new cdk.CfnOutput(this, 'AppClientId', { value: appClient.userPoolClientId });
```

### 4.2 SNS + SQS — Async Messaging

```typescript
// infra/lib/sns-sqs-stack.ts

// Dead Letter Queues (DLQ) — đặt TRƯỚC SQS chính
const dlqMail = new sqs.Queue(this, 'DLQMail', {
  queueName: `mail-dlq-${env}`,
  retentionPeriod: cdk.Duration.days(14),
});

const dlqAudit = new sqs.Queue(this, 'DLQAudit', {
  queueName: `audit-dlq-${env}`,
  retentionPeriod: cdk.Duration.days(14),
});

// Main Queues
const mailQueue = new sqs.Queue(this, 'MailQueue', {
  queueName: `mail-queue-${env}`,
  deadLetterQueue: {
    queue: dlqMail,
    maxReceiveCount: 3,                      // Retry 3 lần rồi cho vào DLQ
  },
  visibilityTimeout: cdk.Duration.seconds(30),
});

const auditQueue = new sqs.Queue(this, 'AuditQueue', {
  queueName: `audit-queue-${env}`,
  deadLetterQueue: {
    queue: dlqAudit,
    maxReceiveCount: 3,
  },
});

// SNS Topics
const memberEventsTopic = new sns.Topic(this, 'MemberEvents', {
  topicName: `member-events-${env}`,
  displayName: 'Member lifecycle events',
});

const fileEventsTopic = new sns.Topic(this, 'FileEvents', {
  topicName: `file-events-${env}`,
});

const notificationsTopic = new sns.Topic(this, 'Notifications', {
  topicName: `notifications-${env}`,
});

// SNS → SQS Subscriptions (fan-out)
memberEventsTopic.addSubscription(
  new sns_subscriptions.SqsSubscription(mailQueue, {
    filterPolicy: {
      eventType: sns.FilterOrPolicy.policy({
        eventType: sns.FilterOrPolicy.exists(),
      }),
    },
  })
);

fileEventsTopic.addSubscription(
  new sns_subscriptions.SqsSubscription(mailQueue, {
    filterPolicy: {
      eventType: ['FILE_UPLOADED', 'FILE_DELETED'],
    },
  })
);

notificationsTopic.addSubscription(
  new sns_subscriptions.SqsSubscription(auditQueue)
);

// Output queue ARNs cho services
new cdk.CfnOutput(this, 'MailQueueArn', { value: mailQueue.queueArn });
new cdk.CfnOutput(this, 'AuditQueueArn', { value: auditQueue.queueArn });
```

### 4.3 S3 Buckets

```typescript
// infra/lib/s3-stack.ts

// Uploads bucket — file-service dùng
const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
  bucketName: `demo-uploads-${env}`,
  versioned: true,                            // Lưu version history
  lifecycleRules: [
    {
      id: 'CleanupOldVersions',
      noncurrentVersionTransitions: [
        { days: 30, storageClass: s3.StorageClass.GLACIER },
      ],
      abortIncompleteMultipartUploadDays: 7,
    },
  ],
  serverAccessLogsBucket: accessLogsBucket,
  serverAccessLogsPrefix: 's3-uploads/',
  removalPolicy: cdk.RemovalPolicy.DESTROY, // Dev: DESTROY, Prod: RETAIN
});

// Frontend static hosting bucket
const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
  bucketName: `aws-demo-frontend-${env}`,
  publicReadAccess: false,                   // CloudFront đọc, không public
  blockPublicAccess: new s3.BlockPublicAccess({
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }),
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

### 4.4 ECS Fargate — Service Deployment (Explicit IAM)

```typescript
// infra/lib/ecs-stack.ts
// ✅ Dùng explicit IAM — mỗi service có Task Role + Execution Role riêng

// 1. Import IAM modules
import { createAuthServiceIAM, createAuthServiceExecutionRole } from './iam/auth-service-iam';
import { createMemberServiceIAM, createMemberServiceExecutionRole } from './iam/member-service-iam';
import { createFileServiceIAM, createFileServiceExecutionRole } from './iam/file-service-iam';
import { createMailServiceIAM, createMailServiceExecutionRole } from './iam/mail-service-iam';
import { createMasterServiceIAM, createMasterServiceExecutionRole } from './iam/master-service-iam';

// 2. ECS Cluster
const cluster = new ecs.Cluster(this, 'EcsCluster', {
  vpc,
  clusterName: `aws-cluster-${env}`,
  enableFargateCapacityProviders: true,
  containerInsights: true,
});

// 3. Tạo IAM roles cho TẤT CẢ services
const taskRoles: Record<string, iam.Role> = {};
const execRoles: Record<string, iam.Role> = {};

taskRoles['auth-service']     = createAuthServiceIAM(this, { envName, userPoolArn, dbSecretArn });
execRoles['auth-service']     = createAuthServiceExecutionRole(this, { envName });

taskRoles['member-service']   = createMemberServiceIAM(this, { envName, memberEventsTopicArn, auditQueueArn, dbSecretArn });
execRoles['member-service']  = createMemberServiceExecutionRole(this, { envName });

taskRoles['file-service']    = createFileServiceIAM(this, { envName, storageBucketArn, fileEventsTopicArn, dbSecretArn });
execRoles['file-service']    = createFileServiceExecutionRole(this, { envName });

taskRoles['mail-service']    = createMailServiceIAM(this, { envName, mailQueueArn, notificationsTopicArn });
execRoles['mail-service']    = createMailServiceExecutionRole(this, { envName });

taskRoles['master-service']  = createMasterServiceIAM(this, { envName, dbSecretArn });
execRoles['master-service']  = createMasterServiceExecutionRole(this, { envName });

// 4. Loop để tạo Task Definition + Container cho mỗi service
const services = [
  { name: 'auth-service',     port: 8084, dbName: 'auth_db'   },
  { name: 'member-service',   port: 8081, dbName: 'member_db' },
  { name: 'file-service',      port: 8082, dbName: 'file_db'   },
  { name: 'mail-service',      port: 8083, dbName: 'mail_db'   },
  { name: 'master-service',    port: 8085, dbName: 'master_db' },
];

for (const svc of services) {
  const taskDef = new ecs.FargateTaskDefinition(this, `${svc.name}TaskDef`, {
    family: `aws-micro-demo-${svc.name}-${envName}`,
    taskRole:    taskRoles[svc.name],   // ✅ explicit — quyền service cần khi chạy
    executionRole: execRoles[svc.name],   // ✅ explicit — quyền ECS cần để boot
    cpu: 256,
    memoryLimitMiB: 512,
    runtimePlatform: {
      operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      cpuArchitecture: ecs.CpuArchitecture.X86_64,
    },
  });

  const container = taskDef.addContainer(`${svc.name}Container`, {
    image: ecs.ContainerImage.fromEcrRepository(ecrRepositories[svc.name]),
    portMappings: [{ containerPort: svc.port }],
    environment: {
      SPRING_PROFILES_ACTIVE: envName,
      AWS_REGION: 'ap-southeast-1',
      DB_HOST: rdsStack.dbInstance.dbInstanceEndpointAddress,
      DB_NAME: svc.dbName,
    },
    secrets: {
      DB_USER:     ecs.Secret.fromSecretsManager(dbCredentials, 'username'),
      DB_PASSWORD: ecs.Secret.fromSecretsManager(dbCredentials, 'password'),
    },
    logging: ecs.LogDrivers.awsLogs({
      streamPrefix: svc.name,
      logGroup: new logs.LogGroup(this, `${svc.name}Logs`, {
        logGroupName: `/ecs/${svc.name}-${envName}`,
        retention: envName === 'prod' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    }),
  });

  // 5. Service Definition
  new ecs.FargateService(this, `${svc.name}Service`, {
    cluster,
    taskDefinition: taskDef,
    desiredCount: envName === 'prod' ? 3 : 1,
    minHealthyPercent: 50,
    maxHealthyPercent: 200,
    healthCheckGracePeriod: cdk.Duration.seconds(30),
    circuitBreaker: { rollback: true },
  });
}
```

> **Checkpoint:** IAM per-service → không dùng shared role. Mỗi service chỉ có quyền nó cần (least privilege). Review bằng cách đọc `infra/lib/iam/*.ts`.

### 4.5 CloudFront + API Gateway

```typescript
// infra/lib/cloudfront-stack.ts

// ACM Certificate — đặt TRƯỚC CloudFront
const certificate = new acm.Certificate(this, 'Certificate', {
  domainName: '*.yourdomain.com',
  validation: acm.CertificateValidation.fromDns(HostedZone.fromHostedZoneAttributes(...)),
});

// CloudFront Distribution
const distribution = new cloudfront.Distribution(this, 'Distribution', {
  defaultBehavior: {
    origin: new origins.S3Origin(frontendBucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
  },
  additionalBehaviors: {
    '/api/*': {
      origin: new origins.HttpOrigin(apiGateway.restApiId + '.execute-api.ap-southeast-1.amazonaws.com'),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // API không cache
    },
  },
  certificate,
  enabled: true,
  priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // ap-southeast-1 only (dev/staging)
});
```

---

## 5. Phần 3 — Local Development Environment

### 5.1 Architecture khi develop

```
┌──────────────────────────────────────────────────────────┐
│                      DEVELOPER MACHINE                    │
│                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────┐  │
│  │   VS Code   │   │   Docker    │   │   AWS CLI     │  │
│  │  (Services) │   │ (PostgreSQL)│   │  (SSO Login) │  │
│  └──────┬──────┘   └──────┬──────┘   └──────┬───────┘  │
│         │                 │                 │           │
│         └────────┬────────┴────────┬────────┘           │
│                  ▼                  ▼                    │
│         ┌────────────────────────────────┐              │
│         │     AWS (Real) qua SSO         │              │
│         │  Cognito | S3 | SNS/SQS | SES  │              │
│         └────────────────────────────────┘              │
│                                                          │
│  LocalStack chỉ dùng khi:                               │
│  - Chưa có AWS account                                   │
│  - CI/CD environment (không có SSO)                     │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Setup Local Development (từng bước)

**Bước 1: AWS SSO Login**

```bash
# Login vào AWS dev
aws sso login --profile aws-dev

# Kiểm tra credentials đang active
aws sts get-caller-identity

# Output mong đợi:
# {
#   "UserId": "AROAXXXXXXXX:botocore-session-...",
#   "Account": "123456789",
#   "Arn": "arn:aws:sts::123456789:assumed-role/AWSReservedSSO_..."
# }
```

**Bước 2: Deploy infrastructure cần thiết cho local dev**

```bash
cd infra

# Deploy từng stack theo thứ tự
npx cdk deploy aws-vpc-dev --profile aws-dev
npx cdk deploy aws-ecr-dev --profile aws-dev
npx cdk deploy aws-cognito-dev --profile aws-dev
npx cdk deploy aws-sns-sqs-dev --profile aws-dev
npx cdk deploy aws-rds-dev --profile aws-dev
npx cdk deploy aws-s3-dev --profile aws-dev
npx cdk deploy aws-ses-dev --profile aws-dev

# ⚠️ Nếu chưa có SES verified email → bỏ qua hoặc dùng SES sandbox
# SES Sandbox: chỉ gửi đến email đã verify trong cùng account
```

**Bước 3: Build Docker images và push lên ECR**

```bash
# Lấy ECR login token
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.ap-southeast-1.amazonaws.com

# Build và push từng service
for svc in auth-service member-service file-service mail-service master-service; do
  aws ecr get-login-password --region ap-southeast-1 | \
    docker login --username AWS --password-stdin \
    123456789.dkr.ecr.ap-southeast-1.amazonaws.com

  docker build -t $svc ./services/$svc
  docker tag $svc:latest \
    123456789.dkr.ecr.ap-southeast-1.amazonaws.com/aws-micro-demo/$svc:latest
  docker push \
    123456789.dkr.ecr.ap-southeast-1.amazonaws.com/aws-micro-demo/$svc:latest
done
```

**Bước 4: Chạy local với real AWS**

```bash
# Root .env — AWS credentials từ SSO
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=<từ SSO cache>
AWS_SECRET_ACCESS_KEY=<từ SSO cache>
AWS_SESSION_TOKEN=<từ SSO cache>

# Root .env — Databases
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres

# Root .env — Cognito (lấy từ CDK output)
COGNITO_USER_POOL_ID=ap-southeast-1_xxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxx

# Root .env — SQS/SNS
AWS_SNS_MEMBER_EVENTS=arn:aws:sns:ap-southeast-1:123456789:member-events-dev
AWS_SQS_MAIL_QUEUE_URL=https://sqs.ap-southeast-1.amazonaws.com/123456789/mail-queue-dev

# Root .env — S3
AWS_S3_UPLOADS_BUCKET=demo-uploads-dev

# Root .env — JWT
JWT_SECRET=<base64 32 bytes, tự tạo>

# Chạy PostgreSQL local
docker compose up postgres -d

# Chạy từng service
mvn spring-boot:run -Dspring-boot.run.profiles=local \
  -Daws.accessKeyId=$AWS_ACCESS_KEY_ID \
  -Daws.secretKey=$AWS_SECRET_ACCESS_KEY \
  -Daws.sessionToken=$AWS_SESSION_TOKEN
```

### 5.3 .env Structure — Đúng cách

```
.env                     ← CÁ NHÂN, gitignored, chứa credentials thật
.env.local              ← .env.example copy, không có secrets (để teammate reference)
.env.example            ← template cho all env vars, KEY= để trống, gitignored
```

```bash
# .gitignore — đảm bảo có dòng này
.env
.env.local
.env.*.local
```

### 5.4 Database Migrations Strategy

```
Hiện tại: dùng Hibernate ddl-auto=update (❌ không production-ready)

Nên dùng: Flyway hoặc Liquibase

→ Chọn Flyway (đơn giản hơn, ít config hơn)

Thêm vào pom.xml:
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

```
services/auth-service/
├── src/main/resources/
│   ├── application.yml
│   ├── application-local.yml
│   ├── application-prod.yml
│   └── db/migration/
│       ├── V1__create_users_table.sql
│       ├── V2__add_cognito_sub_column.sql
│       └── V3__add_status_enum.sql
```

---

## 6. Phần 4 — CI/CD Pipeline

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy-aws.yml

name: Deploy to AWS

on:
  push:
    branches: [main, staging, prod]
  pull_request:
    branches: [main]

env:
  AWS_REGION: ap-southeast-1
  ECR_REPOSITORY_PREFIX: 123456789.dkr.ecr.ap-southeast-1.amazonaws.com/aws-micro-demo

jobs:
  # ============================================================
  # JOB 1: Verify — Build & Test (chạy trước, nhanh nhất)
  # ============================================================
  verify:
    name: Verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Java 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'maven'

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Verify Maven dependencies
        run: ./mvnw dependency:go-offline -B

      - name: Build all services
        run: ./mvnw clean package -B -DskipTests

      - name: Build frontend
        run: npm ci && npm run build
        working-directory: frontend

      - name: CDK Synth
        run: npx cdk synth --context env=${{ github.ref == 'refs/heads/main' && 'dev' || 'staging' }}
        working-directory: infra

  # ============================================================
  # JOB 2: Build & Push Docker Images (chạy song song với verify)
  # ============================================================
  build-push:
    name: Build & Push ECR
    runs-on: ubuntu-latest
    needs: verify
    if: github.event_name == 'push'
    strategy:
      matrix:
        service: [auth-service, member-service, file-service, mail-service, master-service]
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push
        env:
          ECR_REGISTRY: ${{ env.ECR_REPOSITORY_PREFIX }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/${{ matrix.service }}:$IMAGE_TAG \
            -f services/${{ matrix.service }}/Dockerfile .
          docker push $ECR_REGISTRY/${{ matrix.service }}:$IMAGE_TAG

  # ============================================================
  # JOB 3: CDK Deploy (chạy SAU khi image đã push)
  # ============================================================
  deploy:
    name: CDK Deploy
    runs-on: ubuntu-latest
    needs: build-push
    if: github.event_name == 'push'
    environment:
      name: ${{ github.ref == 'refs/heads/prod' && 'production' || 'staging' }}
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-deploy
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy CDK
        env:
          IMAGE_TAG: ${{ github.sha }}
        run: |
          npx cdk deploy "*-${{ env.DEPLOY_ENV }}" \
            --require-approval never \
            --context env=${{ env.DEPLOY_ENV }} \
            --concurrency 3
        working-directory: infra
```

### 6.2 CI/CD Best Practices

| Practice | Mô tả |
|----------|-------|
| **Least privilege for CI/CD** | IAM role riêng cho GitHub Actions, không dùng root/admin |
| **Secrets qua AWS SSM/Secrets** | Không đặt credentials trong GitHub Secrets UI |
| **Build artifact caching** | Maven + npm cache → giảm ~60% thời gian build |
| **Parallel jobs** | Verify + Build push chạy song song |
| **Deploy chỉ sau verify OK** | `needs: verify` đảm bảo code đúng mới deploy |
| **CDK diff trước deploy** | `cdk synth` → xem CloudFormation trước |
| **Require approval cho prod** | GitHub Environment protection rules |
| **Image tag = commit SHA** | Reproducible, biết chính xác version nào đang chạy |

---

## 7. Phần 5 — Staging & Production

### 7.1 Environment Promotion Strategy

```
developer ──push──► main ──merge──► staging ──push──► prod
                              │                   │
                              ▼                   ▼
                         auto-deploy         manual approval
                         (fast feedback)     (gatekept)
```

### 7.2 So sánh Dev vs Staging vs Prod

| Aspect | Dev | Staging | Prod |
|--------|-----|---------|------|
| **RDS instance** | t3.small | t3.medium | r6g.large |
| **RDS storage** | 20 GB | 50 GB | 100 GB |
| **RDS backup** | 7 days | 14 days | 30 days |
| **RDS multi-AZ** | ❌ | ✅ | ✅ |
| **ECS desired count** | 1 | 2 | 3+ |
| **Cognito MFA** | ❌ | ❌ | ✅ |
| **SES** | Sandbox | Sandbox | Production |
| **Deletion protection** | ❌ | ✅ | ✅ |
| **CloudWatch retention** | 7 days | 14 days | 30 days |
| **Auto-scaling** | ❌ | ✅ | ✅ |

### 7.3 Deploy Checklist (trước mỗi production release)

```markdown
## Pre-Production Checklist

### Infrastructure
- [ ] CDK synth không có lỗi
- [ ] Security review: IAM policies đã đúng chưa?
- [ ] RDS deletion protection = true
- [ ] SES đã upgrade từ Sandbox → Production
- [ ] CloudWatch alarms đã set

### Application
- [ ] Chạy `mvn test` → all green
- [ ] Chạy integration tests với staging environment
- [ ] Review changelog

### Communication
- [ ] Notify stakeholders: "Deploying vX.Y.Z at HH:MM UTC"
- [ ] Backup done (RDS automated backup verified)

### Rollback plan
- [ ] Biết cách rollback: `cdk deploy <previous-stack> --no-rollback`
- [ ] Hoặc: revert git commit → CI/CD auto-deploy
```

---

## 8. Phần 6 — Observability & Security

### 8.1 CloudWatch Setup

```typescript
// infra/lib/cloudwatch-stack.ts

// Log Group cho từng service
const logGroup = (service: string, env: string) =>
  new logs.LogGroup(this, `${service}Logs`, {
    logGroupName: `/ecs/${service}-${env}`,
    retention: env === 'prod' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.THREE_DAYS,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

// Alarm: High CPU
new cloudwatch.Alarm(this, 'HighCPU', {
  metric: new cloudwatch.Metric({
    namespace: 'AWS/ECS',
    metricName: 'CPUUtilization',
    dimensions: { ClusterName: cluster.clusterName },
    period: cdk.Duration.minutes(1),
    statistic: 'Average',
  }),
  threshold: 80,
  evaluationPeriods: 3,
  alarmName: `ecs-high-cpu-${env}`,
  alarmDescription: 'CPU > 80% for 3 consecutive minutes',
  actionsEnabled: env === 'prod',
  // alarmAction: new sns.Topic(notificationTopic), // Gửi SNS khi alarm
});

// Alarm: ECS Task failures
new cloudwatch.Alarm(this, 'TaskFailures', {
  metric: new cloudwatch.Metric({
    namespace: 'ECS/ContainerInsights',
    metricName: 'RunningTaskCount',
    dimensions: { ClusterName: cluster.clusterName, ServiceName: service.serviceName },
    period: cdk.Duration.minutes(1),
    statistic: 'Minimum',
  }),
  threshold: 1,                               // Alert khi < 1 task chạy
  comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
});
```

### 8.2 Security Best Practices

```typescript
// 1. Security Groups — deny by default, allow explicitly
const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
  vpc,
  securityGroupName: `db-sg-${env}`,
});

// Chỉ ECS tasks được kết nối DB, port 5432
dbSecurityGroup.addIngressRule(
  ec2.Peer.securityGroupId(ecsSecurityGroup.securityGroupId),
  ec2.Port.tcp(5432),
  'ECS tasks only'
);

// 2. RDS: Không public access
const rdsInstance = new rds.DatabaseInstance(this, 'PostgreSQL', {
  // ...
  publiclyAccessible: false,                  // ⚠️ BẮT BUỘC
});

// 3. S3: Block public access
const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
  // ...
  blockPublicAccess: new s3.BlockPublicAccess({
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }),
});

// 4. Secrets Manager: Automatic rotation
const dbSecret = new secretsmanager.Secret(this, 'DBCredentials', {
  // ...
  rotation: secretsmanager.RotationSchedule.schedule({
    rotationLambda: rotationLambda,
    automaticallyAfter: cdk.Duration.days(30), // Rotate 30 ngày
  }),
});
```

---

## 9. Phần 7 — Deployment Flow (Local → Staging → Prod)

### 9.1 Tổng quan End-to-End Deployment Journey

Đây là **dòng chính** — từ lúc developer code đến khi production chạy. Chia thành 4 stage rõ ràng:

```
STAGE 1: LOCAL DEV          STAGE 2: FEATURE BRANCH      STAGE 3: STAGING         STAGE 4: PRODUCTION
(Developer machine)           (GitHub PR)                  (Auto-deploy)             (Manual gate)
───────────────────────────────────────────────────────────────────────────────────────────────────────
Code → Test → Run            PR → CI Verify               Merge → Auto              Approval → Deploy
     ↓                            ↓                            ↓                         ↓
Docker local               GitHub Actions              ECS Fargate               ECS Fargate
PostgreSQL                 Maven + CDK synth           Real AWS dev              Real AWS prod
AWS SSO (real services)    No deploy                   Smoke tests               Full regression
```

---

### 9.2 Stage 1 — Local Development (Developer)

```
Mục tiêu:  Code chạy được local → verify nhanh → commit
Khi nào:   Đang develop tính năng mới
Ai làm:    Developer (cá nhân)
```

```
1. FEATURE BRANCH
   git checkout -b feature/my-feature

2. SSO LOGIN (kết nối AWS dev)
   aws sso login --profile aws-dev

3. START LOCAL INFRA
   docker compose up postgres -d

4. RUN SERVICE
   mvn spring-boot:run -Dspring-boot.run.profiles=local

5. TEST
   curl http://localhost:8084/api/v1/auth/health

6. COMMIT (khi OK)
   git add . && git commit -m "feat: add my feature"
```

**Quy tắc:**
- Local chỉ dùng `docker compose up postgres` (database local)
- Cognito, S3, SNS/SQS → real AWS dev qua SSO credentials
- KHÔNG commit credentials, secrets, `.env` file
- Mỗi service test riêng trước khi commit

---

### 9.3 Stage 2 — Feature Branch (GitHub PR)

```
Mục tiêu:  Verify code đúng trước khi merge
Khi nào:   Mở Pull Request
Ai làm:    GitHub Actions (automated)
Gates:     Tất cả phải pass mới được merge
```

```
1. DEVELOPER MỞ PR
   git push origin feature/my-feature
   → Tạo Pull Request trên GitHub

2. GITHUB ACTIONS TỰ ĐỘNG CHẠY
   ┌─────────────────────────────────────────────────┐
   │               verify job (chạy song song)       │
   │                                                  │
   │  Maven tests ──────────────────────────── ✅     │
   │  CDK synth ────────────────────────────── ✅     │
   │  Frontend build ──────────────────────── ✅     │
   │  IaC validation ──────────────────────── ✅     │
   └─────────────────────────────────────────────────┘
                      ↓ All green
   ┌─────────────────────────────────────────────────┐
   │          build-push job (matrix, song song)      │
   │                                                  │
   │  auth-service:latest-sha ──────────────── ✅     │
   │  member-service:latest-sha ────────────── ✅     │
   │  file-service:latest-sha ──────────────── ✅     │
   │  mail-service:latest-sha ──────────────── ✅     │
   │  master-service:latest-sha ────────────── ✅     │
   │  frontend:latest-sha ──────────────────── ✅     │
   └─────────────────────────────────────────────────┘

3. REVIEWER CHECK
   - Đọc code changes
   - Xem GitHub Actions logs nếu có lỗi
   - Approve PR

4. MERGE VÀO MAIN
   - Squash merge → main branch
   - Xóa feature branch
```

**CI/CD Pipeline chi tiết:**

```yaml
# .github/workflows/ci.yml

name: Continuous Integration

on:
  pull_request:
    branches: [main]
  push:
    branches: [main, staging]

jobs:
  # ── Verify: Build + Test (không deploy) ──────────
  verify:
    name: Verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'maven'

      - name: Maven verify
        run: ./mvnw clean verify -B

      - name: CDK Synth (validate CDK code)
        run: npx cdk synth --context env=dev
        working-directory: infra

  # ── Build & Push ECR (chỉ chạy khi push vào main) ──
  build-and-push:
    name: Build & Push
    runs-on: ubuntu-latest
    needs: verify
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    # matrix chạy 6 service SONG SONG
    strategy:
      matrix:
        service: [auth-service, member-service, file-service, mail-service, master-service, frontend]
        include:
          - service: frontend
            dockerfile: frontend/Dockerfile
            context: frontend
          - service: auth-service
            dockerfile: services/auth-service/Dockerfile
            context: services/auth-service
          # ... các service còn lại
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS (dùng IAM role, không secret)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions
          aws-region: ap-southeast-1

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build & Push
        run: |
          docker build -t $ECR_REGISTRY/${{ matrix.service }}:${{ github.sha }} \
            -f ${{ matrix.dockerfile }} ${{ matrix.context }}
          docker push $ECR_REGISTRY/${{ matrix.service }}:${{ github.sha }}
```

---

### 9.4 Stage 3 — Staging (Auto-Deploy)

```
Mục tiêu:  Verify toàn bộ hệ thống trên môi trường giống prod
Khi nào:   Merge vào main branch
Ai làm:    CI/CD tự động
Deploy:    Tự động, không cần approve
```

```
1. MERGE VÀO MAIN
   git checkout main && git merge feature/my-feature
   git push origin main

2. CI/CD TỰ ĐỘNG DEPLOY LÊN STAGING
   ┌──────────────────────────────────────────────────────┐
   │                  deploy-staging job                   │
   │                                                        │
   │  Step 1: CDK Deploy (update infra staging)           │
   │  aws-cognito-staging ────────────────────────── ✅     │
   │  aws-sns-sqs-staging ──────────────────────── ✅     │
   │  aws-ecs-staging ──────────────────────────── ✅     │
   │                                                        │
   │  Step 2: ECS Service Update (pull image mới)          │
   │  auth-service ───────────────────────────────── ✅     │
   │  member-service ───────────────────────────── ✅     │
   │  file-service ───────────────────────────────── ✅     │
   │  mail-service ───────────────────────────────── ✅     │
   │  master-service ────────────────────────────── ✅     │
   │  frontend ─────────────────────────────────── ✅     │
   │                                                        │
   │  Step 3: Smoke tests ───────────────────────── ✅     │
   │  curl https://staging.api.yourdomain.com/health        │
   └──────────────────────────────────────────────────────┘

3. QA TEAM VERIFY
   - Manual testing trên staging
   - Nếu OK → proceed Stage 4
   - Nếu lỗi → fix → quay lại Stage 2
```

**Staging deploy workflow:**

```yaml
# .github/workflows/deploy-staging.yml

name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    environment: staging     # GitHub Environment protection
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-deploy
          aws-region: ap-southeast-1

      - name: Deploy CDK Staging
        run: |
          npx cdk deploy "*-staging" \
            --require-approval never \
            --context env=staging
        working-directory: infra

      - name: Update ECS services
        run: |
          for svc in auth member file mail master frontend; do
            aws ecs update-service \
              --cluster aws-cluster-staging \
              --service aws-$svc-staging \
              --force-new-deployment \
              --region ap-southeast-1
          done

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster aws-cluster-staging \
            --services $(aws ecs list-services --cluster aws-cluster-staging --query 'serviceArns[*]' --output text --region ap-southeast-1 | tr '\n' ' ') \
            --region ap-southeast-1

      - name: Smoke tests
        run: |
          curl -f https://staging.api.yourdomain.com/api/v1/auth/health
          curl -f https://staging.yourdomain.com
```

---

### 9.5 Stage 4 — Production (Manual Gate)

```
Mục tiêu:  Deploy lên production với gate bảo mật
Khi nào:   Staging verify OK, tạo release tag
Ai làm:    Tech lead / DevOps (manual approval)
Deploy:    Qua GitHub Actions với environment protection
```

```
1. VERIFY STAGING ĐẦY ĐỦ
   - Tất cả smoke tests pass
   - QA sign-off
   - PM sign-off (nếu cần)

2. TẠO RELEASE TAG
   git tag v1.0.0
   git push origin v1.0.0

3. TẠO PR STAGING → PROD
   git checkout prod
   git merge main
   git push origin prod

4. GITHUB ENVIRONMENT PROTECTION GATE
   ┌────────────────────────────────────────┐
   │  ⚠️ Manual approval required            │
   │                                         │
   │  Reviewers: Tech Lead OR DevOps         │
   │  Timeout: 7 days                        │
   │  Users allowed: @techlead, @devops      │
   └────────────────────────────────────────┘

5. APPROVE + DEPLOY
   Reviewer click "Approve" → GitHub Actions deploy

6. PRODUCTION DEPLOY SEQUENCE
   ┌──────────────────────────────────────────────────────┐
   │  Phase A: Infrastructure (stacked deploy)            │
   │  aws-rds-prod ──────────────────────────────── ✅     │
   │  aws-cognito-prod ─────────────────────────── ✅     │
   │  aws-ecs-prod ─────────────────────────────── ✅     │
   │                                                        │
   │  Phase B: Canary / Blue-Green                         │
   │  Deploy to 25% capacity ──────────────────── ✅     │
   │  Monitor: 5 phút (error rate, latency)               │
   │  If OK → continue; if FAIL → auto rollback            │
   │                                                        │
   │  Deploy to 100% capacity ─────────────────── ✅     │
   │  Monitor: 10 phút                                    │
   └──────────────────────────────────────────────────────┘

7. DEPLOYMENT NOTIFICATION
   - Slack/Email: "v1.0.0 deployed to production ✅"
   - Update changelog
   - Close milestone
```

**Production deploy workflow:**

```yaml
# .github/workflows/deploy-prod.yml

name: Deploy to Production

on:
  push:
    branches: [prod]

jobs:
  # ── Pre-deployment checks ──────────────────────────────
  pre-deploy:
    name: Pre-Deploy Checks
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://yourdomain.com
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}

      - name: Verify staging is healthy
        run: |
          STAGING_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" \
            https://staging.api.yourdomain.com/api/v1/auth/health)
          if [ "$STAGING_HEALTH" != "200" ]; then
            echo "❌ Staging is not healthy. Aborting."
            exit 1
          fi
          echo "✅ Staging is healthy"

      - name: Verify CDK diff
        run: |
          npx cdk diff "*-prod" --context env=prod
        working-directory: infra

  # ── Infrastructure deployment ─────────────────────────
  deploy-infra:
    name: Deploy Infrastructure
    runs-on: ubuntu-latest
    needs: pre-deploy
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-deploy-prod
          aws-region: ap-southeast-1

      - name: Deploy CDK Infrastructure
        run: |
          npx cdk deploy "aws-vpc-prod" --require-approval never --context env=prod
          npx cdk deploy "aws-cognito-prod" --require-approval never --context env=prod
          npx cdk deploy "aws-sns-sqs-prod" --require-approval never --context env=prod
        working-directory: infra

  # ── Service deployment (canary) ───────────────────────
  deploy-services:
    name: Deploy Services (Canary)
    runs-on: ubuntu-latest
    needs: deploy-infra
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-deploy-prod
          aws-region: ap-southeast-1

      - name: Canary deploy (25% traffic)
        run: |
          aws ecs update-service \
            --cluster aws-cluster-prod \
            --service aws-auth-prod \
            --desired-count 1 \
            --task-definition aws-auth-prod:${{ github.sha }}

      - name: Monitor canary (5 phút)
        run: |
          echo "Monitoring canary for 5 minutes..."
          sleep 300
          # Kiểm tra CloudWatch metrics
          aws cloudwatch get-metric-statistics \
            --namespace AWS/ECS \
            --metric-name RunningTaskCount \
            --dimensions Name=ClusterName,Value=aws-cluster-prod \
                       Name=ServiceName,Value=aws-auth-prod \
            --period 60 \
            --statistic Average \
            --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
            --end-time $(date -u +%Y-%m-%dT%H:%M:%S)

      - name: Full deploy (100% traffic)
        run: |
          aws ecs update-service \
            --cluster aws-cluster-prod \
            --service aws-auth-prod \
            --desired-count 3 \
            --task-definition aws-auth-prod:${{ github.sha }}
          # ... các service khác tương tự

      - name: Wait for stability
        run: |
          aws ecs wait services-stable \
            --cluster aws-cluster-prod \
            --services aws-auth-prod aws-member-prod aws-file-prod \
            --region ap-southeast-1

      - name: Notify success
        if: success()
        run: |
          echo "✅ v${{ github.ref_name }} deployed to production"

      - name: Notify failure
        if: failure()
        run: |
          echo "❌ Production deploy failed. Rolling back..."
          aws ecs update-service \
            --cluster aws-cluster-prod \
            --service aws-auth-prod \
            --desired-count 0
```

---

### 9.6 Rollback Strategy

```
KHI NÀO ROLLBACK?
  - Deploy thất bại (ECS task không start)
  - Error rate tăng đột ngột
  - Performance degrade nghiêm trọng
```

```
QUICK ROLLBACK (1 phút):
  # Quay về task definition cũ
  aws ecs update-service \
    --cluster aws-cluster-prod \
    --service aws-auth-prod \
    --task-definition aws-auth-prod:<previous-revision>

FULL ROLLBACK (3 phút):
  # Quay về commit SHA cũ
  git revert HEAD
  git push origin prod
  # CI/CD tự deploy lại
```

**Tự động rollback nếu alarm trigger:**

```typescript
// ECS Service với Auto Rollback
const authService = new ecs.FargateService(this, 'AuthService', {
  cluster,
  taskDefinition: authTask,
  circuitBreaker: {
    rollback: true,        // ⚠️ Tự động rollback nếu deployment fail
  },
  deploymentController: {
    type: ecs.DeploymentControllerType.CODE_DEPLOY,
  },
});
```

---

### 9.7 Tóm tắt Deployment Flow

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                            COMPLETE DEPLOYMENT FLOW                            │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [ LOCAL ]                          [ FEATURE BRANCH ]         [ STAGING ]       │
│    │                                     │                       │              │
│    ▼                                     ▼                       ▼              │
│  1. aws sso login                   2. Open PR              3. Merge main    │
│  2. docker compose up postgres       CI: Maven + CDK synth    CI: CDK deploy   │
│  3. mvn spring-boot:run             CI: Build → ECR push      CI: ECS update   │
│  4. Test locally                    3. Review & Merge         CI: Smoke test   │
│  5. git commit                                                   QA verify      │
│                                                                                 │
│                                                                                 │
│  [ PRODUCTION ]                                                                │
│       │                                                                        │
│       ▼                                                                        │
│  4. Tag release v1.0.0                                                         │
│  5. Merge to prod branch                                                      │
│  6. ⚠️ Manual approval (Tech Lead / DevOps)                                   │
│  7. CDK deploy (VPC → Cognito → ECS)                                          │
│  8. Canary deploy (25% → monitor 5min → 100%)                                │
│  9. ✅ Notify success / ❌ Auto rollback                                      │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Checklist Tổng hợp

### Phase 0: Identity & Access
- [ ] Tạo/have AWS account
- [ ] Setup AWS SSO với profiles: dev, staging, prod
- [ ] Tạo IAM user cho GitHub Actions
- [ ] IAM policies per-service đã define
- [ ] MFA bật trên root account

### Phase 1: Foundation
- [ ] CDK bootstrap cho dev/staging/prod
- [ ] VPC với public/private/isolated subnets
- [ ] ECR repositories cho 5 services + frontend
- [ ] Secrets Manager với rotation
- [ ] RDS PostgreSQL với multi-AZ (prod)

### Phase 2: Services Infrastructure
- [ ] Cognito User Pool + App Client
- [ ] SNS Topics + SQS Queues + DLQs
- [ ] S3 buckets với lifecycle rules
- [ ] SES setup (sandbox → prod sau)
- [ ] ECS Cluster + Fargate tasks definitions

### Phase 3: Local Development
- [ ] `aws sso login --profile aws-dev` hoạt động
- [ ] PostgreSQL local via Docker compose
- [ ] Services chạy local trỏ vào AWS dev
- [ ] Flyway migrations setup

### Phase 4: CI/CD
- [ ] GitHub Actions workflow
- [ ] ECR push pipeline
- [ ] CDK deploy pipeline
- [ ] Environment protection rules (prod cần approve)
- [ ] Rollback plan documented

### Phase 5: Production Readiness
- [ ] All alarms configured
- [ ] SES production access approved
- [ ] CloudWatch dashboards
- [ ] Backup strategy verified
- [ ] Runbook documented

---

## 11. CDK Quick Reference

```bash
# ==== Setup ====
cd infra

# Cài đặt dependencies
npm install

# Bootstrap (chạy 1 lần cho mỗi account)
npx cdk bootstrap aws://ACCOUNT_ID/ap-southeast-1 --profile aws-dev

# ==== Development ====
npx cdk synth                          # Generate CloudFormation
npx cdk diff                           # Xem thay đổi
npx cdk diff --profile aws-dev         # Xem diff cho dev account

# ==== Deploy ====
npx cdk deploy --all --profile aws-dev  # Deploy tất cả stacks
npx cdk deploy aws-vpc-dev --profile aws-dev  # Deploy 1 stack cụ thể
npx cdk deploy --require-approval never # Deploy không cần approve (CI/CD)

# ==== Cleanup ====
npx cdk destroy --profile aws-dev      # Xóa hết resources (⚠️ CẨN THẬN)
npx cdk destroy aws-rds-dev --profile aws-dev  # Xóa 1 stack

# ==== Context (environment) ====
npx cdk synth --context env=dev        # Dev
npx cdk synth --context env=staging    # Staging
npx cdk synth --context context env=prod  # Production

# ==== Troubleshooting ====
npx cdk doctor                         # Kiểm tra CDK setup
npx cdk list                           # Liệt kê tất cả stacks
aws cloudformation describe-stacks --stack-name aws-vpc-dev \
  --profile aws-dev                    # Xem stack details
```

### Thứ tự deploy CDK stacks

```
Bắt buộc deploy theo thứ tự này (dependencies):

1. aws-vpc-dev
   └── 2. aws-ecr-dev
         └── 3. aws-cognito-dev
               └── 4. aws-sns-sqs-dev
                     └── 5. aws-s3-dev
                           └── 6. aws-ses-dev
                                 └── 7. aws-rds-dev
                                       └── 8. aws-ecs-dev
                                             └── 9. aws-cloudfront-dev
                                                   └── 10. aws-cloudwatch-dev
```

---

## Summary — Senior DevOps Mental Model

```
Đừng code ngay. Đừng deploy ngay.
ĐỪNG LÀM GÌ cho đến khi HIỂU toàn bộ hệ thống.

Khi hiểu rồi, làm theo thứ tự:

  Foundation (IaC)     → Infrastructure cần thiết (VPC, IAM, Secrets)
  Per-service setup    → Từng service connect vào infra
  Local dev            → Dev trỏ vào AWS thật
  CI/CD                → Automate deploy
  Production-ready     → Security, monitoring, backups
  Staging → Prod       → Environment promotion
```

> **Nguyên tắc:** Mọi thứ infrastructure phải nằm trong `infra/` directory, được version control, và deploy qua CI/CD — không có manual click vào AWS Console cho production resources.
