# CI/CD Deployment Guide — From Zero to Production

> **Mục tiêu:** Hướng dẫn từ A-Z cách thiết lập CI/CD pipeline và deploy toàn bộ hệ thống microservices lên AWS.
> **Áp dụng cho:** Monorepo `aws/` — 5 Java services + Next.js frontend + CDK Infrastructure.

---

## Table of Contents

1. [Tổng quan Pipeline](#1-tổng-quan-pipeline)
2. [Kiến trúc AWS Infrastructure](#2-kiến-trúc-aws-infrastructure)
3. [Chuẩn bị trước khi deploy](#3-chuẩn-bị-trước-khi-deploy)
4. [Thiết lập GitHub Repository](#4-thiết-lập-github-repository)
5. [Thiết lập IAM Role cho GitHub Actions (OIDC)](#5-thiết-lập-iam-role-cho-github-actions-oidc)
6. [CDK Bootstrap (chạy 1 lần)](#6-cdk-bootstrap-chạy-1-lần)
7. [Pipeline chi tiết — 5 Jobs](#7-pipeline-chi-tiết--5-jobs)
8. [Environments & Branching Strategy](#8-environments--branching-strategy)
9. [CDK Stacks & Deployment Order](#9-cdk-stacks--deployment-order)
10. [Troubleshooting & Rollback](#10-troubleshooting--rollback)

---

## 1. Tổng quan Pipeline

Pipeline CI/CD được thực hiện hoàn toàn qua **GitHub Actions**, chia thành **5 jobs** chạy tuần tự:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions Pipeline                          │
│                                                                          │
│  ┌─────────────┐                                                        │
│  │  JOB 1      │                                                        │
│  │  VERIFY     │─── Build Java (Maven) + CDK Synth (validation)         │
│  └──────┬──────┘                                                        │
│         │                                                                │
│    ┌────┴────┐                                                           │
│    │         │                                                           │
│  ┌─┴───────┐ ┌┴────────────────┐                                        │
│  │ JOB 2   │ │ JOB 3           │                                        │
│  │ BUILD & │ │ DEPLOY INFRA    │─── CDK deploy --all (VPC, RDS, ECS...) │
│  │ PUSH ECR│ │ (CDK)           │                                        │
│  └────┬────┘ └───────┬─────────┘                                        │
│       │              │                                                   │
│  ┌────┴──────────────┴───┐                                              │
│  │ JOB 4                 │                                              │
│  │ FORCE ECS REDEPLOY    │─── aws ecs update-service --force            │
│  └───────────────────────┘                                              │
│                                                                          │
│  ┌───────────────────────┐                                              │
│  │ JOB 5                 │                                              │
│  │ DEPLOY FRONTEND       │─── npm build → S3 sync → CF invalidate      │
│  └───────────────────────┘                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

**Trigger conditions:**

| Environment | Branch | Trigger | Workflow File |
|-------------|--------|---------|---------------|
| **develop** | `dev` | Push / PR / Manual | `deploy-aws-dev.yml` |
| **staging** | `staging` | Push / PR / Manual | `deploy-aws-stg.yml` |
| **production** | `main` | Push / PR / Manual | `deploy-aws.yml` |

---

## 2. Kiến trúc AWS Infrastructure

Toàn bộ infrastructure được quản lý bằng **AWS CDK (TypeScript)**, nằm trong folder `infra/`.

```
                           ┌────────────────────┐
                           │   CloudFront CDN    │
                           │  (Static + API)     │
                           └────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              ┌─────┴─────┐                 ┌───────┴──────┐
              │ S3 Bucket  │                │ API Gateway  │
              │ (Frontend) │                │ (HTTP v2)    │
              └────────────┘                └───────┬──────┘
                                                    │ VPC Link
                                            ┌───────┴──────┐
                                            │ Internal NLB │
                                            └───────┬──────┘
                                                    │
                              ┌──────────────────────┼──────────────────────┐
                              │                      │                      │
                     ┌────────┴───┐          ┌───────┴────┐         ┌──────┴──────┐
                     │ ECS Fargate│          │ ECS Fargate│         │ ECS Fargate │
                     │ auth:8084  │          │ member:8081│         │ file:8082   │
                     └────────────┘          └────────────┘         └─────────────┘
                     ┌────────────┐          ┌────────────┐
                     │ ECS Fargate│          │ ECS Fargate│
                     │ mail:8083  │          │ master:8085│
                     └──────┬─────┘          └──────┬─────┘
                            │                       │
                     ┌──────┴───────────────────────┴──────┐
                     │          RDS PostgreSQL 16           │
                     │      (Private Subnet, Encrypted)    │
                     └─────────────────────────────────────┘

  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │ Cognito      │    │ SNS Topics   │    │ SQS Queues   │
  │ User Pool    │    │ + DLQ        │    │ + DLQ        │
  └──────────────┘    └──────────────┘    └──────────────┘
  ┌──────────────┐    ┌──────────────┐
  │ S3 (Storage) │    │ CloudWatch   │
  │ File uploads │    │ Logs/Alarms  │
  └──────────────┘    └──────────────┘
```

### CDK Stacks (10 stacks, ordered by dependency)

| # | Stack | File | Mô tả |
|---|-------|------|-------|
| 1 | `VpcStack` | `vpc-stack.ts` | VPC, 2 AZ, Public/Private subnets, NAT GW, Security Groups |
| 2 | `SnsSqsStack` | `sns-sqs-stack.ts` | 3 SNS Topics + 3 SQS Queues + 3 DLQs |
| 3 | `EcrStack` | `ecr-stack.ts` | 5 ECR repositories (1 per service) |
| 4 | `RdsStack` | `rds-stack.ts` | PostgreSQL 16 (t3.micro), Secrets Manager credentials |
| 5 | `CognitoStack` | `cognito-stack.ts` | User Pool + App Client |
| 6 | `S3Stack` | `s3-stack.ts` | File storage bucket |
| 7 | `EcsStack` | `ecs-stack.ts` | ECS Cluster, 5 Fargate Tasks, Internal NLB, Cloud Map |
| 8 | `ApiGatewayStack` | `apigateway-nlb-stack.ts` | HTTP API Gateway v2, VPC Link, JWT Authorizer |
| 9 | `CloudFrontStack` | `cloudfront-stack.ts` | CloudFront Distribution, Frontend S3 bucket, OAC |
| 10 | `CloudWatchStack` | `cloudwatch-stack.ts` | Log Groups, Alarms, Dashboard |

---

## 3. Chuẩn bị trước khi deploy

### 3.1 Checklist

```
□ Có AWS Account
□ Đã cài AWS CLI v2 (aws --version ≥ 2.x)
□ Đã cài Node.js 20+ (cho CDK và Frontend)
□ Đã cài Java 17 (cho backend services)
□ Đã cài Docker Desktop
□ Có GitHub repository với code đã push
```

### 3.2 Tools & Versions

| Tool | Version | Dùng cho |
|------|---------|----------|
| Java | 17 (Temurin) | Build Spring Boot services |
| Node.js | 20 | CDK, Frontend build |
| AWS CDK | Latest (via `npx`) | Infrastructure as Code |
| Maven | 3.9+ (via `./mvnw`) | Java build tool |
| Docker | Latest | Container images |

---

## 4. Thiết lập GitHub Repository

### 4.1 GitHub Environments

Tạo 3 environments trong **Settings → Environments**:

| Environment | Dùng cho | Protection Rules |
|-------------|----------|------------------|
| `develop` | Dev deployments | Không cần approval |
| `staging` | Staging deployments | Không cần approval |
| `production` | Production deployments | **Yêu cầu approval** |

### 4.2 GitHub Secrets & Variables

**Settings → Secrets and variables → Actions**

#### Secrets (bắt buộc)

| Name | Giá trị | Mô tả |
|------|---------|-------|
| `AWS_DEPLOY_ROLE_ARN_DEV` | `arn:aws:iam::ACCOUNT_ID:role/github-actions-deploy` | IAM Role ARN cho OIDC |
| `AWS_DEPLOY_ROLE_ARN_STG` | `arn:aws:iam::ACCOUNT_ID:role/github-actions-deploy` | IAM Role ARN cho OIDC |
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::ACCOUNT_ID:role/github-actions-deploy` | IAM Role ARN cho OIDC |

#### Variables (bắt buộc)

| Name | Giá trị | Mô tả |
|------|---------|-------|
| `AWS_ACCOUNT_ID` | `123456789012` | AWS Account ID |

---

## 5. Thiết lập IAM Role cho GitHub Actions (OIDC)

Pipeline sử dụng **OIDC (OpenID Connect)** để authenticate — không cần lưu Access Key/Secret Key.

### Bước 1: Tạo OIDC Provider trong AWS

```
AWS Console → IAM → Identity providers → Add provider

Provider type:  OpenID Connect
Provider URL:   https://token.actions.githubusercontent.com
Audience:       sts.amazonaws.com
```

### Bước 2: Tạo IAM Role

```
AWS Console → IAM → Roles → Create role

Trusted entity type: Web identity
Identity provider:   token.actions.githubusercontent.com
Audience:            sts.amazonaws.com
```

**Trust Policy (JSON):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
        }
      }
    }
  ]
}
```

> ⚠️ Thay `ACCOUNT_ID`, `YOUR_ORG/YOUR_REPO` bằng giá trị thực.

### Bước 3: Attach Policies

Attach các managed policies sau cho role:

| Policy | Lý do |
|--------|-------|
| `AdministratorAccess` | CDK cần full access để tạo/quản lý resources (cho dev/staging) |

> **Production**: Nên tạo custom policy với least-privilege thay vì `AdministratorAccess`.

### Bước 4: Lưu Role ARN

Copy ARN của role vừa tạo → paste vào GitHub Secrets:

```
Name:  AWS_DEPLOY_ROLE_ARN
Value: arn:aws:iam::123456789012:role/github-actions-deploy
```

---

## 6. CDK Bootstrap (chạy 1 lần)

CDK Bootstrap tạo các resources cần thiết (S3 bucket, IAM roles) để CDK có thể deploy. **Chỉ cần chạy 1 lần per account/region.**

### Tự động (trong Pipeline)

Pipeline đã bao gồm step bootstrap:

```yaml
- name: 🔄 CDK Bootstrap
  working-directory: ./infra
  run: |
    npx cdk bootstrap \
      aws://${{ vars.AWS_ACCOUNT_ID }}/${{ env.AWS_REGION }} \
      --force || echo "Bootstrap already done, continuing..."
```

### Thủ công (từ local)

```bash
# Login AWS
aws sso login --profile aws-dev

# Bootstrap
cd infra
npm ci
npx cdk bootstrap aws://ACCOUNT_ID/ap-southeast-1 --profile aws-dev
```

---

## 7. Pipeline chi tiết — 5 Jobs

### JOB 1: Verify Code & Synthesize

**Mục đích:** Đảm bảo code compile được và CDK templates hợp lệ trước khi deploy.

```
Steps:
1. Checkout repository
2. Setup Java 17 (Temurin) + Maven cache
3. Build tất cả 5 Java services (mvn clean package -DskipTests)
4. Setup Node.js 20 + npm cache
5. Install CDK dependencies (npm ci)
6. Configure AWS credentials (OIDC)
7. CDK Synthesize (npx cdk synth --context env=<environment>)
```

**Nếu fail:** Toàn bộ pipeline dừng. Kiểm tra:
- Lỗi compile Java → fix code
- Lỗi CDK synth → fix TypeScript trong `infra/lib/`

---

### JOB 2: Build & Push Docker Images → ECR

**Mục đích:** Build Docker images cho 5 services và push lên Amazon ECR.

**Chạy song song** với JOB 3 (cả hai đều chỉ cần JOB 1 pass).

```
Strategy: Matrix (5 services chạy parallel)
  - auth-service
  - member-service
  - file-service
  - mail-service
  - master-service

Steps:
1. Checkout repository
2. Setup Docker Buildx
3. Configure AWS credentials (OIDC)
4. Login to Amazon ECR
5. Build & Push Docker Image
   Tags:
     - <registry>/aws-micro-demo/<service>:latest
     - <registry>/aws-micro-demo/<service>:<commit-sha>
   Cache: GitHub Actions cache (type=gha)
```

**Dockerfile pattern** (tất cả services giống nhau):

```dockerfile
# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

### JOB 3: Deploy AWS Infrastructure (CDK)

**Mục đích:** Tạo/cập nhật toàn bộ AWS resources thông qua CDK.

```
Steps:
1. Checkout repository
2. Setup Node.js 20
3. Configure AWS credentials (OIDC)
4. Install CDK dependencies (npm ci)
5. CDK Bootstrap (skip nếu đã làm)
6. CDK Deploy --all --require-approval never --context env=<environment>
```

**CDK deploy order** (tự động theo dependency):

```
VpcStack → RdsStack ─────────────────────┐
SnsSqsStack ─────────────────────────────┤
EcrStack ────────────────────────────────┤
CognitoStack ────────────────────────────┼─→ EcsStack → ApiGatewayStack → CloudFrontStack
S3Stack ─────────────────────────────────┘                                      │
                                                                     CloudWatchStack
```

---

### JOB 4: Force ECS Redeploy

**Mục đích:** Buộc ECS services pull Docker images mới từ ECR.

**Chạy sau** JOB 2 + JOB 3 hoàn thành.

```
Steps:
1. Configure AWS credentials (OIDC)
2. Force redeploy tất cả 5 services:
   aws ecs update-service \
     --cluster aws-micro-demo-<env> \
     --service <service-name>-<env> \
     --force-new-deployment
3. Wait for services to stabilize:
   aws ecs wait services-stable \
     --cluster aws-micro-demo-<env> \
     --services <service-name>-<env>
```

**ECS Cluster naming convention:**

| Environment | Cluster Name | Service Name Pattern |
|-------------|-------------|---------------------|
| develop | `aws-micro-demo-develop` | `auth-service-develop` |
| staging | `aws-micro-demo-staging` | `auth-service-staging` |
| production | `aws-micro-demo-production` | `auth-service-production` |

---

### JOB 5: Deploy Frontend → S3 + CloudFront

**Mục đích:** Build Next.js frontend và deploy static assets lên S3, sau đó invalidate CloudFront cache.

```
Steps:
1. Checkout repository
2. Setup Node.js 20
3. Configure AWS credentials (OIDC)
4. Get CloudFront domain from CloudFormation outputs
5. Build Next.js frontend (npm ci && npm run build)
   Environment variables injected at build time:
     NEXT_PUBLIC_API_URL=https://<cloudfront-domain>
     NEXT_PUBLIC_AUTH_SERVICE_URL=https://<cloudfront-domain>/api/v1/auth
     NEXT_PUBLIC_MEMBER_SERVICE_URL=https://<cloudfront-domain>/api/v1/members
     NEXT_PUBLIC_FILE_SERVICE_URL=https://<cloudfront-domain>/api/v1/files
     NEXT_PUBLIC_MAIL_SERVICE_URL=https://<cloudfront-domain>/api/v1/mails
     NEXT_PUBLIC_MASTER_SERVICE_URL=https://<cloudfront-domain>/api/v1/master
6. Upload static assets to S3:
   - .next/static/ → s3://bucket/_next/static/ (cache: immutable, 1 year)
   - .next/ (rest) → s3://bucket/ (cache: must-revalidate)
7. Invalidate CloudFront cache (paths: /*)
```

---

## 8. Environments & Branching Strategy

### Git Flow

```
feature/xxx ──PR──► dev ──merge──► staging ──merge──► main
                     │               │                  │
                     ▼               ▼                  ▼
              deploy-aws-dev   deploy-aws-stg     deploy-aws
              (auto)           (auto)              (requires approval)
```

### So sánh Environments

| Aspect | develop | staging | production |
|--------|---------|---------|------------|
| CDK context | `--context env=develop` | `--context env=staging` | `--context env=production` |
| GitHub Environment | `develop` | `staging` | `production` |
| ECS Cluster | `aws-micro-demo-develop` | `aws-micro-demo-staging` | `aws-micro-demo-production` |
| CloudFront Stack | `CloudFrontStack-develop` | `CloudFrontStack-staging` | `CloudFrontStack-production` |
| Approval Required | ❌ | ❌ | ✅ |
| RDS Instance | t3.micro | t3.micro | t3.micro (upgrade for prod) |

---

## 9. CDK Stacks & Deployment Order

### Deploy thủ công (từ local)

```bash
# 1. Login AWS
aws sso login --profile aws-dev

# 2. Install dependencies
cd infra
npm ci

# 3. Synthesize (xem CloudFormation template)
npx cdk synth --context env=develop --profile aws-dev

# 4. Diff (xem thay đổi trước khi apply)
npx cdk diff --context env=develop --profile aws-dev

# 5. Deploy tất cả stacks
npx cdk deploy --all --context env=develop --require-approval never --profile aws-dev

# 6. Deploy 1 stack cụ thể
npx cdk deploy EcsStack-develop --context env=develop --profile aws-dev
```

### Destroy (xóa toàn bộ)

```bash
# ⚠️ CẢNH BÁO: Xóa TẤT CẢ resources (DB, S3, etc.)
npx cdk destroy --all --context env=develop --profile aws-dev
```

### Xem outputs sau deploy

```bash
aws cloudformation describe-stacks \
  --stack-name CloudFrontStack-develop \
  --query 'Stacks[0].Outputs' \
  --output table
```

**Outputs quan trọng:**

| Stack | Output Key | Giá trị |
|-------|-----------|---------|
| `CloudFrontStack` | `CloudFrontDomainName` | Domain truy cập app |
| `CloudFrontStack` | `FrontendBucketName` | S3 bucket cho frontend |
| `CognitoStack` | `UserPoolId` | Cognito User Pool ID |
| `CognitoStack` | `UserPoolClientId` | App Client ID |
| `RdsStack` | `RdsEndpoint` | Database endpoint |
| `EcsStack` | `ClusterName` | ECS cluster name |
| `ApiGatewayStack` | `ApiGatewayUrl` | API endpoint |

---

## 10. Troubleshooting & Rollback

### Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|-----|-------------|----------|
| `ExpiredTokenException` | SSO token hết hạn | `aws sso login --profile aws-dev` |
| `CDK Bootstrap required` | Chưa bootstrap account/region | Chạy `npx cdk bootstrap` |
| `ECS service not found` | Service chưa tạo (lần deploy đầu) | Pipeline tự skip, deploy lại lần 2 |
| `ECR login failed` | OIDC role thiếu quyền ECR | Attach `AmazonEC2ContainerRegistryFullAccess` |
| `CloudFrontStack not found` | Chưa deploy infra | Deploy CDK trước, rồi frontend |
| `mvn: command not found` | Thiếu `chmod +x` cho mvnw | Pipeline đã tự xử lý |
| `RDS connection refused` | ECS tasks chưa start xong | Wait for stabilize hoặc check Security Groups |

### Rollback

**Option 1: Revert git commit** (recommended)

```bash
git revert HEAD
git push origin main
# Pipeline tự chạy lại với code cũ
```

**Option 2: Redeploy image cũ**

```bash
# Tìm commit SHA của version trước
aws ecr describe-images \
  --repository-name aws-micro-demo/auth-service \
  --query 'imageDetails[*].imageTags' \
  --output table

# Force deploy image cụ thể
# → Cập nhật task definition với image tag cũ
```

**Option 3: CDK rollback**

```bash
# CDK tự rollback nếu deploy fail
# Nếu cần manual:
npx cdk deploy EcsStack-production \
  --context env=production \
  --profile aws-prod
```

### Monitoring sau deploy

```bash
# Xem ECS service status
aws ecs describe-services \
  --cluster aws-micro-demo-production \
  --services auth-service-production member-service-production \
  --query 'services[*].{name:serviceName,status:status,running:runningCount,desired:desiredCount}'

# Xem logs
aws logs tail /ecs/aws-micro-demo/production/auth-service --follow

# Xem CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix "aws-micro-demo" \
  --query 'MetricAlarms[*].{Name:AlarmName,State:StateValue}'
```

---

## Quick Reference

### Deploy lần đầu (from scratch)

```bash
# 1. Setup GitHub
#    - Tạo OIDC provider trong AWS
#    - Tạo IAM Role với trust policy
#    - Thêm Secrets: AWS_DEPLOY_ROLE_ARN
#    - Thêm Variables: AWS_ACCOUNT_ID
#    - Tạo Environments: develop, staging, production

# 2. Push code lên branch tương ứng
git push origin dev      # → triggers deploy-aws-dev.yml
git push origin staging  # → triggers deploy-aws-stg.yml
git push origin main     # → triggers deploy-aws.yml (needs approval)

# 3. Kiểm tra kết quả
#    GitHub → Actions tab → xem pipeline logs
#    AWS Console → CloudFormation → xem stacks
#    AWS Console → ECS → xem running tasks
```

### Deploy thường ngày

```bash
# Feature development
git checkout -b feature/my-feature
# ... code ...
git push origin feature/my-feature
# Tạo PR → dev → auto deploy to develop

# Promote to staging
# Merge dev → staging → auto deploy

# Promote to production
# Merge staging → main → requires approval → deploy
```
