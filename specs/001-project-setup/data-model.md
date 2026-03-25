# Data Model: Phase 1 Environment Configuration

## Environment Variables (.env)

The following variables are required for the local development environment to bridge the microservices with LocalStack and the PostgreSQL database.

| Variable | Description | Default (Local) |
| :--- | :--- | :--- |
| **AWS_REGION** | LocalStack region | `ap-northeast-1` |
| **AWS_ACCESS_KEY_ID** | Mock access key | `test` |
| **AWS_SECRET_ACCESS_KEY** | Mock secret key | `test` |
| **DB_HOST** | PostgreSQL container host | `localhost` |
| **DB_PORT** | PostgreSQL port | `5432` |
| **DB_USER** | Root database user | `admin` |
| **DB_PASSWORD** | Root database password | `password` |
| **LOCALSTACK_URL** | Host for LocalStack | `http://localhost:4566` |
| **MEMBER_SERVICE_URL** | API for Member Service | `http://localhost:8081` |
| **FILE_SERVICE_URL** | API for File Service | `http://localhost:8082` |
| **MAIL_SERVICE_URL** | API for Mail Service | `http://localhost:8083` |
| **AUTH_SERVICE_URL** | API for Auth Service | `http://localhost:8084` |
| **MASTER_SERVICE_URL** | API for Master Service | `http://localhost:8085` |

## Database Schema (Logical Separation)

A single PostgreSQL 15 instance will manage 5 logical databases:
1. `member_db`
2. `file_db`
3. `mail_db`
4. `auth_db`
5. `master_db`

Each database will be automatically created by the `init-db.sql` script on startup.
