# 🚀 AWS Microservice Demo - PHASE 8: AWS Services Configuration Checklist

[< Previous Phase: Phase 7](./phase-7.md)

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

## Cost estimation (demo environment, ap-southeast-1):
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

[< Previous Phase: Phase 7](./phase-7.md)
