# 🚀 AWS Microservices Local Demo Guide

This manual assumes you have successfully launched `docker-compose up -d --build`.

## Step 1: Initialize Cloud Mocks
Before anything else, we must mock AWS endpoints locally:
```bash
# Triggers AWS S3 / SNS / SQS offline structures inside LocalStack
bash ./scripts/localstack-init.sh
```

## Step 2: The E2E Test Suite
The easiest way to prove the AWS ecosystem works is triggering the automated test bounds:
```bash
bash ./scripts/test-apis.sh
```

## Step 3: Verifying Asynchronous SNS -> SQS Flows
When `test-apis.sh` fired off Step 2, the `member-service` published a JSON blob to a mock SNS Topic. Our mocked SQS queue immediately sucked that message down.

You can verify it by peeking inside the `mail-service` Docker Container Logs:
```bash
docker logs mail-service
```
> *You should visibly see Spring picking up SQS polling batches showing "Email Sent to Test User".*

## Step 4: Storage Verification
Want to prove the S3 upload actually stayed inside our local "fake" S3 bucket? Hit the LocalStack endpoint via the AWS CLI natively:
```bash
# We use awslocal which behaves identically to aws cli
docker exec demo-localstack awslocal s3 ls s3://demo-uploads
```
> *You will notice `test-sample.txt` floating inside the queried bucket list.*

## Congratulations! You've just fully tested a 100% simulated, extremely modular AWS Microservice infrastructure logic mapping without needing IAM keys!

---

## ☁️ Cloud Verification (The "Mây" Demo)

If you have already deployed this system to AWS via GitHub Actions (Phase 8), follow these steps to verify it live:

### 1. The Global Entry Point
Find your **CloudFront URL** in the CDK outputs or the AWS Console. 
- Access the URL. It should load the Next.js frontend securely via HTTPS.

### 2. Live API Testing
Use the Frontend to **Sign Up**.
- Verify that a `POST` request is sent to the API Gateway.
- Check the **Cognito Console** to see if your user was created.

### 3. Asynchronous Success (Live SNS/SQS)
Upload a file via the "Files" dashboard.
- Check the **S3 Bucket** (defined in `S3Stack`) for the new file.
- Check the **SQS Queue Monitoring** in the AWS Console. You should see a "Message Received" and "Message Deleted" spike.
- If **SES** is verified, check your inbox for a success notification!

### 4. Operational Checklist
For a deep-dive into every service's health, ALWAYS consult:
- **[AWS-SETUP-CHECKLIST.md](./AWS-SETUP-CHECKLIST.md)**
