# mail-service

## Description
Email sending & logging — sends emails via AWS SES, logs to PostgreSQL, consumes mail-job messages from SQS queue.

## Infra
- **PostgreSQL** (`mail_db`) — email logs
- **AWS SES** — sends emails
- **AWS SQS** — consumes `mail-queue` for mail jobs
- **LocalStack** (dev only) — emulates SES/SQS

## Env vars required

| Variable | Example | Notes |
|----------|---------|-------|
| `DB_HOST` | `localhost` | |
| `DB_NAME` | `mail_db` | |
| `DB_USERNAME` | `admin` | |
| `DB_PASSWORD` | `password` | |
| `AWS_REGION` | `ap-southeast-1` | |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | Real AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | `xxx` | Real AWS credentials |
| `AWS_SES_FROM_EMAIL` | `no-reply@demo.com` | Verified sender in SES |
| `AWS_SQS_MAIL_QUEUE_URL` | `http://localhost:4566/.../mail-queue` | SQS queue URL |

## Ports
- `8083`
