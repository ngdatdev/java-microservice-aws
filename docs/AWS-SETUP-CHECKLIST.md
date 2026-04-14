# 🚀 AWS Microservice Demo: AWS Services Configuration Checklist

This guide provides the mandatory manual steps and troubleshooting procedures for deploying and maintaining the microservice ecosystem on AWS.

## 📋 Pre-deployment Checklist

### 1. AWS Account Setup
- [ ] **AWS CLI Configured**: Run `aws configure` and verify credentials.
- [ ] **CDK Bootstrapped**: Run `cdk bootstrap aws://{ACCOUNT_ID}/{REGION}` in your terminal.
- [ ] **Secrets Registered**: Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are in GitHub Repository Secrets.
- [ ] **Environment Context**: Ensure `envName` is set to `dev` in `cdk.json` or passed via `--context env=dev`.

---

## 🛠️ Manual Service Configuration (Post-CDK Deploy)

### 2. SES Setup (Mandatory Manual Steps)
AWS SES starts in "Sandbox Mode", which prevents sending emails to unverified addresses.
- [ ] **Verify Identities**: Go to SES Console → Verified Identities. Verify the `FROM` email address used in `MailService`.
- [ ] **Sandbox Management**: Either **Request Production Access** (to send to anyone) OR manually add every recipient email address to the "Verified Identities" list.
- [ ] **Configuration Set**: Verify that the CDK-created configuration set exists in the SES console.

### 3. Cognito User Pool Verification
- [ ] **Client IDs**: After deployment, go to Cognito Console → User Pools.
- [ ] **Update Frontend**: Note the `User Pool ID` and `App Client ID`. Update the `.env` file in the `frontend` directory.
- [ ] **Test Registration**: Use the UI to register a test user and verify they appear in the Cognito dash.

---

## ✅ Post-deployment Verification

- [ ] **ECS Health**: Check ECS Console → Clusters → `aws-micro-demo-dev`. All 5 tasks must be in `RUNNING` status (green).
- [ ] **RDS Connectivity**: Check ECS Task logs in CloudWatch. Ensure services are not reporting `Connection Refused` to the database.
- [ ] **API Gateway**: Ping the HTTP API endpoint (provided in CDK outputs) to verify VPC Link connectivity.
- [ ] **CloudFront**: Access the CloudFront URL. The Next.js frontend should load and interact with the API Gateway.
- [ ] **Event Flow**: Upload a file -> Check if `FileService` publishes to SNS -> Check if `MailService` SQS queue receives it -> Check if email is sent.

---

## 🔍 Troubleshooting Guide

| Issue | Root Cause | Resolution |
|-------|------------|------------|
| **ECS Task CrashLoop** | Missing Env Vars or Incorrect DB Secret | Check CloudWatch Logs for `Spring Boot` startup errors. Verify Secret ARN in Task Definition. |
| **API Gateway 502/504** | NLB Target Group Unhealthy | Check ECS Service Security Groups. Ensure Port 8081-8085 is open to the NLB. |
| **RDS Connection Refused** | Security Group Misconfiguration | Ensure RDS SG allows inbound traffic from ECS SG on Port 5432. |
| **SES Email Not Sent** | SES Sandbox Mode | Verify recipient email or request SES exit-sandbox. |
| **ECR Login Fails** | IAM Permissions | Ensure the GitHub IAM user has `AmazonEC2ContainerRegistryPowerUser` policy. |

---

## 💰 Cost Optimization (Demo Ready)

- [ ] **NAT Gateway**: This is the most expensive demo component ($45/m). **Delete it** immediately after the demo if not using the cloud.
- [ ] **ECS Scaling**: Scale the desired task count to `0` when not testing.
- [ ] **RDS Stop**: Use the "Stop Database" feature in the RDS console during idle periods.
