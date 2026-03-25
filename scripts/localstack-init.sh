#!/bin/bash
echo "Initializing LocalStack resources..."

# S3 Buckets
awslocal s3 mb s3://demo-uploads
awslocal s3 mb s3://demo-member-photos

# SQS Queues
awslocal sqs create-queue --queue-name mail-queue
awslocal sqs create-queue --queue-name audit-queue

# SNS Topics
awslocal sns create-topic --name global-notifications
awslocal sns subscribe --topic-arn arn:aws:sns:ap-northeast-1:000000000000:global-notifications --protocol sqs --notification-endpoint arn:aws:sqs:ap-northeast-1:000000000000:mail-queue

# Cognito
awslocal cognito-idp create-user-pool --pool-name demo-pool
# Note: For Demo, we assume IDs are set in environment or match defaults in application.yml

# SES
awslocal ses verify-email-identity --email-address no-reply@demo.com

echo "LocalStack initialization complete."
