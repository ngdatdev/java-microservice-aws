# Application Architecture

## 1. System Topology

The AWS Microservice Demo represents a highly decoupled, serverless-oriented web ecosystem. While the codebase is structured locally, it translates exactly to pure AWS managed components via CDK.

```text
       [End User]
           │ (HTTPS)
   ┌───────┴───────┐
   │  CloudFront   │  <- NextJS Frontend (S3 Hosted)
   └───────┬───────┘
           │
  ┌────────▼────────┐
  │   API Gateway   │  <- Cognito User Auth Verification
  └────────┬────────┘
           │
 ┌─────────▼─────────┐
 │   Internal NLB    │  <- Traffic distribution into Fargate VPC
 └─────────┬─────────┘
           │
  ┌────────▼────────┐
  │   ECS Fargate   │  <- 5 Dockerized Spring Boot Clusters
  │  (Microservices)│
  └────────┬────────┘
           │
   ┌───────┼────────────────┬───────────────┐
   │       │                │               │
┌──▼──┐ ┌──▼───┐       ┌────▼────┐     ┌────▼────┐
│ S3  │ │ SES  │       │   RDS   │     │  SNS    │
│(Doc)│ │(Mail)│       │(Postgres│     │(Events) │
└─────┘ └──────┘       └─────────┘     └────┬────┘
                                            │
                                       ┌────▼────┐
                                       │  SQS    │
                                       │(Queues) │
                                       └─────────┘
```

## 2. Service Boundary Explanations

- **Member Service (Port 8081)**: Manages raw user entity registration mapping alongside Cognito identity IDs. Publishes `MEMBER_CREATED` async broadcast events to SNS.
- **File Service (Port 8082)**: Accepts multi-part arrays. Proxies stream connections securely into Amazon S3 (or LocalStack S3). Issues a `FILE_UPLOADED` SNS event.
- **Mail Service (Port 8083)**: Possesses zero public entry points logically. Listens explicitly to SQS queues hooked to SNS topics. Upon receiving internal payloads, proxies sending logic to AWS SES routing channels.
- **Auth Service (Port 8084)**: Synchronizes authorization flows heavily backed directly into AWS Cognito APIs.
- **Master Service (Port 8085)**: Aggregation orchestrator simplifying backend interactions for the NextJS UI endpoints.

## 3. The LocalStack Magic

In order to run this locally without paying for AWS Sandbox resources, we employ **LocalStack**. The Spring Boot applications load an alternative `application.yml` profile which hijacks standard AWS Java SDK endpoint injection domains, funneling `sns.us-east-1.amazonaws.com` aggressively to `http://localstack:4566`.

---

## 4. CI/CD Pipeline (The DevOps Loop)

The system utilizes **GitHub Actions** as the primary orchestrator for Continuous Delivery.

1.  **Stage 1 (Verify)**: Every PR triggers a full Java Maven build, Next.js build, and `cdk synth` for the target environment (`--context env=dev`).
2.  **Stage 2 (Ship)**: Merges to `main` trigger Docker builds for the 5 services. Images are pushed to **Amazon ECR** tagged with the Git SHA.
3.  **Stage 3 (Deploy)**: The pipeline executes `cdk deploy --all` to update ECS task definitions and infrastructure stacks.

## 5. Security & Identity

- **Auth**: Primary identity provider is **Amazon Cognito**.
- **Least Privilege**: Each ECS task runs with a dedicated IAM Task Role restricting access to only the specific S3 buckets or SQS queues required for its business logic.
- **Secrets**: Database credentials are in **AWS Secrets Manager**, rotated and injected at runtime by ECS.
