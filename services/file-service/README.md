# file-service

## Description
File upload & metadata management — stores files in S3, tracks metadata in PostgreSQL, publishes file events to SNS.

## Infra
- **PostgreSQL** (`file_db`) — file metadata
- **AWS S3** — stores uploaded files
- **AWS SNS** — publishes `file-events` topic
- **LocalStack** (dev only) — emulates S3/SNS

## Env vars required

| Variable | Example | Notes |
|----------|---------|-------|
| `DB_HOST` | `localhost` | |
| `DB_NAME` | `file_db` | |
| `DB_USERNAME` | `admin` | |
| `DB_PASSWORD` | `password` | |
| `AWS_REGION` | `ap-southeast-1` | |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | Real AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | `xxx` | Real AWS credentials |
| `AWS_S3_BUCKET_NAME` | `demo-uploads` | S3 bucket name |
| `AWS_SNS_FILE_EVENTS_TOPIC_ARN` | `arn:aws:sns:ap-southeast-1:...:file-events` | SNS topic ARN |

## Ports
- `8082`
