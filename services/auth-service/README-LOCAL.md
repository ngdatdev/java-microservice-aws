# Local Development Guide — auth-service

## Prerequisites

- Java 17+
- Maven 3.9+
- Docker & Docker Compose (chỉ cần cho PostgreSQL)
- AWS CLI (`pip install awscli`)
- Tài khoản AWS với quyền Cognito

## Infrastructure Stack

| Service | Port | Version | Purpose |
|---------|------|---------|---------|
| PostgreSQL | 5432 | 16 | Primary database |
| auth-service | 8080 | — | This service |

> **Không cần LocalStack.** Dùng AWS Cognito thật cho cả local lẫn prod.

---

## 1. Tạo User Pool trên AWS (nếu chưa có)

Truy cập [AWS Console → Cognito](https://console.aws.amazon.com/cognito), tạo User Pool:

1. **Pool name**: `auth-service-pool`
2. **Sign-in options**: Email
3. **Password policy**: Default
4. **MFA**: Off (dev), On (prod)
5. **User creation**: Allow
6. Sau khi tạo xong → copy **Pool ID** (ví dụ: `ap-northeast-1_AbC123def`)

Tạo App Client:
1. Vào **App integration** → **App clients** → **Add an app client**
2. **App client name**: `auth-service-client`
3. **Generate secret**: **Không tick** (recommended cho JWT)
4. **Allowed callback URLs**: `http://localhost:8080/api/v1/auth/callback` (dev)
5. Copy **App client ID**

---

## 2. Setup AWS Credentials (local)

### Cách 1 — AWS SSO (khuyến nghị, có token hết hạn)

```powershell
# Cài đặt AWS CLI v2 đã có sẵn
aws configure sso

# Ví dụ:
# SSO start URL [None]: https://my-aws-sso.awsapps.com/start
# Region [None]: ap-northeast-1
# Output [None]: json
# Default client Region [None]: ap-northeast-1

# Sau khi configure xong, login
aws sso login --profile auth-service-dev
```

AWS SSO cung cấp **temporary credentials có thời hạn** (thường 8-16 giờ). Khi hết hạn, chạy lại `aws sso login`.

### Cách 2 — Static Access Key (không khuyến nghị)

```powershell
aws configure
# AWS Access Key ID: AKIAXXXXXXXXXXX
# AWS Secret Access Key: ************
# Default region: ap-northeast-1
# Default output: json
```

> ⚠️ **Cảnh báo:** Static keys không có expiry, không an toàn cho production. Chỉ dùng cho dev offline.

---

## 3. Start PostgreSQL

```bash
docker compose up -d
```

Hoặc thủ công:

```bash
docker run -d --name auth-postgres \
  -e POSTGRES_DB=auth_db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 postgres:16-alpine
```

## 4. Set Environment Variables

```powershell
# AWS credentials (từ SSO đã login ở bước 2)
$env:AWS_ACCESS_KEY_ID="<lấy từ SSO cache>"
$env:AWS_SECRET_ACCESS_KEY="<lấy từ SSO cache>"
$env:AWS_SESSION_TOKEN="<lấy từ SSO cache>"
$env:AWS_REGION="ap-northeast-1"

# Cognito (từ bước 1)
$env:COGNITO_USER_POOL_ID="ap-northeast-1_AbC123def"
$env:COGNITO_CLIENT_ID="7a8b9c0d1e2f3g4h5i6j"

# JWT (tự tạo base64 32 bytes)
$env:JWT_SECRET="dGhpcy1pcy1hLXZlcnktc2VjdXJlLWtleS0zMi1ieXRlcy1sb25nLWZvci10ZXN0aW5n"

# Database
$env:DB_HOST="localhost"
$env:DB_USER="admin"
$env:DB_PASSWORD="password"
```

Hoặc dùng `.env` + dotenv plugin trong `pom.xml`.

## 5. Run Service

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

## 6. Verify

```bash
# Health check
curl http://localhost:8080/api/v1/auth/health

# Swagger UI
open http://localhost:8080/swagger-ui.html
```

---

## Credentials Expiry — Khi nào cần refresh?

| Credential Type | Expiry | How to refresh |
|----------------|--------|----------------|
| SSO tokens | 8–16 giờ | `aws sso login --profile <name>` |
| STS temp credentials | 1–12 giờ | Gọi `aws sts get-session-token` |
| Static Access Keys | **Không bao giờ** | Không cần, nhưng **nguy hiểm** |

Nếu gặp lỗi `The security token included in the request is expired`:
```bash
aws sso login --profile auth-service-dev
```

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | Access key ID (SSO/static) |
| `AWS_SECRET_ACCESS_KEY` | Secret access key |
| `AWS_SESSION_TOKEN` | Session token (SSO/STS temporary) |
| `AWS_REGION` | AWS region (mặc định: `ap-northeast-1`) |
| `COGNITO_USER_POOL_ID` | **BẮT BUỘC** — Pool ID từ AWS Console |
| `COGNITO_CLIENT_ID` | **BẮT BUỘC** — App Client ID |
| `JWT_SECRET` | **BẮT BUỘC** — base64 32-byte key |
| `DB_HOST` | PostgreSQL host (mặc định: `localhost`) |
| `DB_USER` | DB username (mặc định: `admin`) |
| `DB_PASSWORD` | DB password (mặc định: `password`) |

## Troubleshooting

**`ExpiredTokenException` / `The security token included in the request is expired`**
→ Chạy lại `aws sso login`

**`ResourceNotFoundException` / Pool not found**
→ Kiểm tra `COGNITO_USER_POOL_ID` đúng chưa, region khớp với `AWS_REGION`

**`NotAuthorizedException`**
→ Kiểm tra `COGNITO_CLIENT_ID` đúng chưa, App Client có enable không

**PostgreSQL connection refused**
→ Kiểm tra Docker: `docker ps | grep auth-postgres`
