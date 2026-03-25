# 🚀 AWS Microservice Demo - PHASE 1: Project Structure & Local Dev Setup

[Next Phase: Phase 2 >](./phase-2.md)

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

[Next Phase: Phase 2 >](./phase-2.md)
