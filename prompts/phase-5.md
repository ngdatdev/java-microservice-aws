# 🚀 AWS Microservice Demo - PHASE 5: CI/CD Pipeline (CodeCommit + CodeBuild + CodePipeline)

[< Previous Phase: Phase 4](./phase-4.md) | [Next Phase: Phase 6 >](./phase-6.md)

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

[< Previous Phase: Phase 4](./phase-4.md) | [Next Phase: Phase 6 >](./phase-6.md)
