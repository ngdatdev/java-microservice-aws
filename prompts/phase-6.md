# 🚀 AWS Microservice Demo - PHASE 6: CDK App Entry Point & Deployment

[< Previous Phase: Phase 5](./phase-5.md) | [Next Phase: Phase 7 >](./phase-7.md)

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

[< Previous Phase: Phase 5](./phase-5.md) | [Next Phase: Phase 7 >](./phase-7.md)
