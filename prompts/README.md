# AWS Microservice Demo Prompts

This directory contains the prompts broken down by phase.

- [Phase 1: Project Structure & Local Dev Setup](./phase-1.md)
- [Phase 2: Java Microservices (All 5 Services)](./phase-2.md)
- [Phase 3: Next.js Frontend](./phase-3.md)
- [Phase 4: AWS Infrastructure (CDK)](./phase-4.md)
- [Phase 5: CI/CD Pipeline (CodeCommit + CodeBuild + CodePipeline)](./phase-5.md)
- [Phase 6: CDK App Entry Point & Deployment](./phase-6.md)
- [Phase 7: Local Testing & Demo Scripts](./phase-7.md)
- [Phase 8: AWS Services Configuration Checklist](./phase-8.md)

---

## 📊 Summary: AWS Services Used vs Purpose

| AWS Service | Used In | Purpose |
|---|---|---|
| ECS Fargate | All services | Run microservice containers |
| ECR | All services | Store Docker images |
| RDS PostgreSQL | All services | Database |
| API Gateway (HTTP) | Frontend entry | Route requests, Cognito auth |
| NLB | Internal | VPC Link target for API GW |
| CloudFront | Frontend | CDN + S3 static hosting |
| Route53 | DNS | Domain routing |
| Cognito | auth-service | User auth, JWT tokens |
| S3 | file-service, frontend | File storage + static hosting |
| SES | mail-service | Send emails |
| SNS | All services | Event pub/sub |
| SQS | mail-service, file-service | Async message queue |
| CloudWatch | All | Logs, metrics, alarms, dashboard |
| Secrets Manager | RDS credentials | Secure secret storage |
| CodeCommit | CI/CD | Git repository |
| CodeBuild | CI/CD | Build + deploy pipeline |
| CodePipeline | CI/CD | Orchestrate Dev/Staging/Prod flows |
| Direct Connect | Mocked | External system integration (use VPN mock) |

---

## 🎯 Quick Start Order

```
Phase 1 → Generate project structure
Phase 2 → Generate all 5 Java services
Phase 3 → Generate Next.js frontend
Phase 4 → Generate all CDK stacks (8 prompts)
Phase 5 → Generate CI/CD pipeline CDK
Phase 6 → Generate CDK entry point + deploy scripts
Phase 7 → Generate docker-compose + test scripts
Phase 8 → Generate setup checklist

Local test: docker-compose up
AWS deploy: cd infra && npm run deploy:dev
```

