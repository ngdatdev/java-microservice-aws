# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Xây dựng giao diện quản trị (Admin Dashboard) sử dụng **Next.js 14 App Router** để quản lý và vận hành hệ thống microservices. Giao diện sẽ tích hợp trực tiếp với **auth-service** (Cognito), **member-service** (CRUD), **file-service** (S3), **mail-service** (SQS) và **master-service** (Aggregator). Sử dụng **shadcn/ui** và **Tailwind CSS** để đảm bảo UX/UI chuyên nghiệp và nhất quán với Constitution.

**Language/Version**: TypeScript / Next.js 14.2+ (App Router)  
**Primary Dependencies**: Tailwind CSS, shadcn/ui, Lucide React, Axios, Zod, React Hook Form  
**Storage**: LocalStorage (Session storage for JWT tokens)  
**Testing**: Jest + React Testing Library  
**Target Platform**: AWS S3 + CloudFront (Static Website Hosting) or ECS Fargate  
**Project Type**: Web Application (Dashboard)  
**Performance Goals**: First Contentful Paint < 1.5s, Fully Interactive < 3s  
**Constraints**: Phải tương thích với API Endpoint của LocalStack (`localhost:4566` hoặc proxy qua microservices).  
**Scale/Scope**: ~10 Route/Pages, tích hợp 5 hệ thống backend khác nhau.

| Gate | Status | Justification |
|------|--------|---------------|
| **Tech Stack Consistency** | ✅ Pass | Sử dụng Next.js 14, Tailwind, TypeScript như Constitution v1.3.0 yêu cầu. |
| **Security (Cognito)** | ✅ Pass | Auth flow tích hợp qua Cognito (auth-service). |
| **Observability** | ✅ Pass | Implement health check route (`/api/health`) và error boundaries. |
| **Port Standardization** | ✅ Pass | Chạy mặc định trên port 3000. |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
frontend/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/             # Login/Register routes 
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── members/        # Member management
│   │   ├── files/          # File management
│   │   └── mail/           # Mail testing
│   ├── api/                # Route handlers (if needed for proxying)
│   └── layout.tsx          # Root layout with Sidebar
├── components/             # Reusable UI components
│   ├── ui/                 # shadcn/ui base components
│   ├── layout/             # Sidebar, Navbar, Breadcrumbs
│   └── forms/              # Common form logic (Zod + RH Form)
├── lib/                    # Utility functions and API clients
│   ├── api/                # Service client wrappers (fetcher)
│   ├── auth/               # Token storage & validation logic
│   └── utils.ts            # Tailwind merge and common utils
├── public/                 # Static assets
└── types/                  # Shared TypeScript interfaces (DTO mapping)
```

**Structure Decision**: Sử dụng layout mặc định của Next.js 14 App Router với folder `frontend/` tại root của monorepo.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
