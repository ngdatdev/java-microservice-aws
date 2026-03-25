# 🚀 AWS Microservice Demo - PHASE 7: Local Testing & Demo Scripts

[< Previous Phase: Phase 6](./phase-6.md) | [Next Phase: Phase 8 >](./phase-8.md)

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

[< Previous Phase: Phase 6](./phase-6.md) | [Next Phase: Phase 8 >](./phase-8.md)
