# Local Development Guide — auth-service

## Prerequisites

- Java 17+
- Maven 3.9+
- Docker & Docker Compose
- AWS CLI (`brew install awscli`)

## Infrastructure Stack

| Service | Port | Version | Purpose |
|---------|------|---------|---------|
| PostgreSQL | 5432 | 16 | Primary database |
| LocalStack | 4566 | 3.0 | Cognito emulator |
| auth-service | 8080 | — | This service |

## 1. Start Infrastructure

```bash
docker compose up -d
```

LocalStack sẽ tự động init Cognito pool khi container start (nhờ `bootstrap-localstack.sh` trong `init/ready.d/`).

**Hoặc chạy thủ công:**

```bash
# PostgreSQL
docker run -d --name auth-postgres \
  -e POSTGRES_DB=auth_db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 postgres:16-alpine

# LocalStack
docker run -d --name auth-localstack \
  -e SERVICES=cognito \
  -e DEFAULT_REGION=ap-northeast-1 \
  -p 4566:4566 localstack/localstack:3.0

# Init Cognito pool
./scripts/bootstrap-localstack.bat    # Windows
./scripts/bootstrap-localstack.sh    # Linux/macOS
```

## 2. Init Cognito User Pool

**Windows:**
```powershell
.\scripts\bootstrap-localstack.bat
```

**Linux/macOS:**
```bash
chmod +x ./scripts/bootstrap-localstack.sh
./scripts/bootstrap-localstack.sh
```

Script sẽ tạo User Pool và App Client, in ra giá trị `COGNITO_USER_POOL_ID` và `COGNITO_CLIENT_ID` để gán vào biến môi trường.

## 3. Run Service

**Windows (PowerShell):**
```powershell
$env:AWS_ACCESS_KEY_ID="test"
$env:AWS_SECRET_ACCESS_KEY="test"
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

**Linux / macOS:**
```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Hoặc đặt env vars trước trong file `.env` (tự tạo, không commit):

```
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
DB_HOST=localhost
DB_USER=admin
DB_PASSWORD=password
LOCALSTACK_URL=http://localhost:4566
COGNITO_USER_POOL_ID=<lấy từ bước 2>
COGNITO_CLIENT_ID=<lấy từ bước 2>
JWT_SECRET=dGhpcy1pcy1hLXZlcnktc2VjdXJlLWtleS0zMi1ieXRlcy1sb25nLWZvci10ZXN0aW5n
```

## 4. Verify

```bash
# Health check
curl http://localhost:8080/api/v1/auth/health

# Swagger UI
open http://localhost:8080/swagger-ui.html
```

## Configuration Profiles

| Profile | Description |
|---------|-------------|
| `common` | Luôn load, chứa shared config |
| `local` | Dev local: LocalStack + PostgreSQL, debug logs |
| `prod` | Production: real AWS Cognito + RDS, info logs |

**Cách Spring Boot load:**
1. `application.yml` (base, luôn load)
2. `application-common.yml` (shared across all)
3. `application-{active}.yml` (local hoặc prod)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `auth_db` | Database name |
| `DB_USER` | `admin` | Database username |
| `DB_PASSWORD` | `password` | Database password |
| `AWS_REGION` | `ap-northeast-1` | AWS region |
| `LOCALSTACK_URL` | `http://localhost:4566` | LocalStack endpoint (local only) |
| `COGNITO_USER_POOL_ID` | — | **BẮT BUỘC** — Cognito User Pool ID |
| `COGNITO_CLIENT_ID` | — | **BẮT BUỘC** — Cognito App Client ID |
| `JWT_SECRET` | — | **BẮT BUỘC** — base64 32-byte key |
| `JWT_EXPIRATION` | `86400000` | JWT TTL (ms) |

## Troubleshooting

**Service không start?**
```bash
docker ps                           # Kiểm tra container đang chạy
docker logs auth-postgres           # Xem logs PostgreSQL
docker logs auth-localstack         # Xem logs LocalStack
```

**Cognito 400/404?**
```bash
# Kiểm tra LocalStack health
curl http://localhost:4566/_localstack/health
# Kiểm tra pool đã tạo chưa
aws cognito-idp list-user-pools --endpoint-url http://localhost:4566 --region ap-northeast-1
```

**JWT errors?**
- Đảm bảo `JWT_SECRET` là base64 chuỗi ít nhất 32 bytes.
- Không dùng secret mặc định trong production.