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

## Final Remarks
Congratulations! You've just fully tested a 100% simulated, extremely modular AWS Microservice infrastructure logic mapping without needing IAM keys!
