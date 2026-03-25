# 🚀 AWS Microservice Demo - PHASE 3: Next.js Frontend

[< Previous Phase: Phase 2](./phase-2.md) | [Next Phase: Phase 4 >](./phase-4.md)

---

## 📋 SYSTEM CONTEXT (Paste này vào đầu mọi session với AI Agent)

```
You are an expert AWS cloud architect and full-stack developer.
We are building a DEMO microservice system on AWS to learn infrastructure setup.
The goal is NOT production-perfect code, but working demos that use every AWS service listed.
Keep business logic minimal — focus on correct AWS integration patterns.

Tech stack:
- Backend: Java 17, Spring Boot 3.x, Maven
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Container: Docker → ECR → ECS Fargate
- Database: Amazon RDS PostgreSQL
- Auth: Amazon Cognito
- Storage: Amazon S3
- Email: Amazon SES
- Messaging: Amazon SNS + SQS
- API: Amazon API Gateway + NLB (internal) + CloudFront
- Monitoring: Amazon CloudWatch
- CI/CD: CodeCommit + CodeBuild + CodePipeline
- IaC: AWS CDK (TypeScript) or Terraform (pick one per agent)
```

---

### 🤖 PROMPT FOR AI AGENT

```
TASK: Generate a complete Next.js 14 (App Router) frontend for the AWS Microservice Demo.

## Tech: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui

## Purpose: Simple admin dashboard UI to demo all microservice APIs

## Required Pages & Components:

### Pages (app/ directory):
- app/page.tsx                    → Dashboard (calls master-service /dashboard)
- app/members/page.tsx            → Member list with Create/Edit/Delete
- app/members/[id]/page.tsx       → Member detail
- app/files/page.tsx              → File list + Upload UI
- app/auth/login/page.tsx         → Login form (calls auth-service)
- app/auth/register/page.tsx      → Register form
- app/mail/page.tsx               → Send test email form
- app/layout.tsx                  → Root layout with sidebar nav

### Components (components/):
- Navbar.tsx
- Sidebar.tsx (links: Dashboard, Members, Files, Send Mail)
- MemberTable.tsx (with pagination)
- MemberForm.tsx (create/edit modal)
- FileUploader.tsx (drag & drop, shows progress)
- FileList.tsx
- SendMailForm.tsx
- DashboardStats.tsx (cards: total members, files, etc.)
- AuthGuard.tsx (redirect to login if no token)
- Toast notifications

### API Layer (lib/):
- lib/api/members.ts      → fetch wrapper for member-service
- lib/api/files.ts        → fetch wrapper for file-service  
- lib/api/auth.ts         → fetch wrapper for auth-service
- lib/api/mail.ts         → fetch wrapper for mail-service
- lib/api/master.ts       → fetch wrapper for master-service
- lib/auth/token.ts       → localStorage token management
- lib/types.ts            → TypeScript interfaces

## Environment variables (next.config.js):
NEXT_PUBLIC_MEMBER_SERVICE_URL=http://localhost:8081
NEXT_PUBLIC_FILE_SERVICE_URL=http://localhost:8082
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:8084
NEXT_PUBLIC_MAIL_SERVICE_URL=http://localhost:8083
NEXT_PUBLIC_MASTER_SERVICE_URL=http://localhost:8085

## UI Requirements:
- Dark theme, professional admin dashboard look
- Show loading states and error messages
- Toast notifications for success/error actions
- Auth token stored in localStorage, sent as Bearer token in headers
- File upload shows progress bar
- Dashboard shows real-time stats cards

## File Upload flow:
1. User selects file → POST /api/v1/files/upload (multipart/form-data)
2. Show upload progress
3. Display file list with download button
4. Download button → GET /api/v1/files/{id}/download → open pre-signed URL

## Auth flow:
1. Login page → POST /api/v1/auth/login → store token
2. All API calls include Authorization: Bearer {token}
3. 401 response → redirect to login

Generate 100% complete working code for every file. Include package.json with all dependencies.
```

---

[< Previous Phase: Phase 2](./phase-2.md) | [Next Phase: Phase 4 >](./phase-4.md)
