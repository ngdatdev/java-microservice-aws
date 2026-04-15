# mail-service

## Description
Email logging & SQS consumer — logs email requests to PostgreSQL (mock sender), consumes mail-job messages from SQS queue.

## Infra
- **PostgreSQL** (`mail_db`) — email logs
- **AWS SQS** — consumes `mail-queue` for mail jobs
- **AWS SNS** — publishes notifications (via notifications topic)

## Env vars required

| Variable | Example | Notes |
|----------|---------|-------|
| `DB_HOST` | `localhost` | |
| `DB_NAME` | `mail_db` | |
| `DB_USERNAME` | `admin` | |
| `DB_PASSWORD` | `password` | |
| `AWS_REGION` | `ap-southeast-1` | |
| `AWS_SQS_MAIL_QUEUE_URL` | `https://sqs.ap-southeast-1.amazonaws.com/.../mail-queue` | SQS queue URL |

## Ports
- `8083`
