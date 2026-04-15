# member-service

## Description
Member profile CRUD — creates/reads/updates/deletes member records. Publishes domain events to SNS; consumes SQS audit events.

## Infra
- **PostgreSQL** (`member_db`) — member records
- **AWS SNS** — publishes `member-events` topic
- **AWS SQS** — consumes `audit-queue` for audit events
- **LocalStack** (dev only) — emulates SNS/SQS

## Env vars required

| Variable | Example | Notes |
|----------|---------|-------|
| `DB_HOST` | `localhost` | |
| `DB_NAME` | `member_db` | |
| `DB_USERNAME` | `admin` | |
| `DB_PASSWORD` | `password` | |
| `AWS_REGION` | `ap-southeast-1` | |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | Real AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | `xxx` | Real AWS credentials |
| `AWS_SNS_MEMBER_EVENTS_TOPIC_ARN` | `arn:aws:sns:ap-southeast-1:...:member-events` | SNS topic ARN |
| `AWS_SQS_AUDIT_QUEUE_URL` | `http://localhost:4566/.../audit-queue` | SQS queue URL |

## Ports
- `8081`
