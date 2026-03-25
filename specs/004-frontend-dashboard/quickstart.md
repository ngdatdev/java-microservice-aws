# Quickstart: Frontend Dashboard (Phase 3)

## Local Development Setup

### 1. Prerequisites
- Node.js 20+
- All 5 microservices running and healthy (see root Quickstart).

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Environment Configuration
Ensure root `.env` includes the necessary frontend URLs:
```bash
NEXT_PUBLIC_MEMBER_SERVICE_URL=http://localhost:8081
NEXT_PUBLIC_FILE_SERVICE_URL=http://localhost:8082
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:8084
NEXT_PUBLIC_MAIL_SERVICE_URL=http://localhost:8083
NEXT_PUBLIC_MASTER_SERVICE_URL=http://localhost:8085
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Key Features to Test
- **Login**: Navigate to `/auth/login`.
- **Dashboard**: Ensure counts for Members and Files are displayed correctly.
- **S3 Upload**: Test file upload and pre-signed URL download.
