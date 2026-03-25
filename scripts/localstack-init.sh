#!/bin/bash
echo "Initializing LocalStack resources..."

# S3 Buckets
awslocal s3 mb s3://uploads
awslocal s3 mb s3://member-photos

# SQS Queues
awslocal sqs create-queue --queue-name mail-queue
awslocal sqs create-queue --queue-name audit-queue

# SNS Topics
awslocal sns create-topic --name global-notifications
awslocal sns subscribe --topic-arn arn:aws:sns:ap-northeast-1:000000000000:global-notifications --protocol sqs --notification-endpoint arn:aws:sqs:ap-northeast-1:000000000000:mail-queue

echo "LocalStack initialization complete."
