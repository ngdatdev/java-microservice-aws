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
USER_POOL_ID=$(awslocal cognito-idp create-user-pool --pool-name demo-pool --query 'UserPool.Id' --output text)
CLIENT_ID=$(awslocal cognito-idp create-user-pool-client --user-pool-id $USER_POOL_ID --client-name demo-client --query 'UserPoolClient.ClientId' --output text)

echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $CLIENT_ID"

# Seed Admin Account
awslocal cognito-idp admin-create-user \
    --user-pool-id $USER_POOL_ID \
    --username admin@example.com \
    --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true \
    --message-action SUPPRESS

awslocal cognito-idp admin-set-user-password \
    --user-pool-id $USER_POOL_ID \
    --username admin@example.com \
    --password Password123! \
    --permanent

# SES
awslocal ses verify-email-identity --email-address no-reply@demo.com

echo "LocalStack initialization complete."
