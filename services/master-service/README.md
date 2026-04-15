# master-service

## Description
Admin facade — exposes category CRUD and `/dashboard` aggregating member + file counts. Aggregates data from member/file services via WebClient.

## Infra
- **PostgreSQL** (`master_db`) — category records
- No AWS SDK deps

## Env vars required

| Variable | Example | Notes |
|----------|---------|-------|
| `DB_HOST` | `localhost` | |
| `DB_NAME` | `master_db` | |
| `DB_USERNAME` | `admin` | |
| `DB_PASSWORD` | `password` | |
| `MEMBER_SERVICE_URL` | `http://localhost:8081` | member-service base URL |
| `FILE_SERVICE_URL` | `http://localhost:8082` | file-service base URL |

## Ports
- `8085`
