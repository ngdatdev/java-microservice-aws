# auth-service

## Description
User authentication & registration — signup, login via AWS Cognito, issues JWTs, stores user records in PostgreSQL.

## Infra
- **PostgreSQL** (`auth_db`) — user records, password hashes
- **AWS Cognito** — user pool for real auth
- **LocalStack** (dev only) — emulates Cognito

## Env vars required

| Variable | Example | Notes |
|----------|---------|-------|
| `DB_HOST` | `localhost` | |
| `DB_NAME` | `auth_db` | |
| `DB_USERNAME` | `admin` | |
| `DB_PASSWORD` | `password` | |
| `AWS_REGION` | `ap-southeast-1` | Must match Cognito user pool region |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | Real AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | `xxx` | Real AWS credentials |
| `COGNITO_USER_POOL_ID` | `ap-southeast-1_AmwwuZ5NZ` | From Cognito console |
| `COGNITO_CLIENT_ID` | `ndt1rat0gocnuqs09sl0d3asr` | App client ID |
| `JWT_SECRET` | `base64...` | Base64-encoded signing key |

## Ports
- `8084`
