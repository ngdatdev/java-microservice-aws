# Research: Next.js Frontend Integration Patterns

## Decision: Authentication Integration
- **Choice**: Custom Fetch Wrapper + Next.js Middleware.
- **Rationale**: While AWS Amplify is an option, a custom wrapper using the `aws-sdk-client-cognito-identity-provider` in the `auth-service` (Backend) is already implemented. The frontend will communicate with the `auth-service` API.
- **Alternatives considered**: AWS Amplify UI Components (rejected to keep UI consistent with shadcn/ui).

## Decision: Data Fetching (RSC vs Client)
- **Choice**: **React Server Components (RSC)** for initial page loads and list views; **Client Components** for forms and interactive mutations.
- **Rationale**: RSC reduces bundle size and improves SEO/performance. Client components are necessary for state-heavy forms (React Hook Form) and toast notifications.
- **Alternatives considered**: Use SWR or React Query for everything (rejected for simplicity in a demo project).

## Decision: File Upload Implementation
- **Choice**: **Client-side upload to Route Handler** → **Direct to microservice**.
- **Rationale**: Since the `file-service` handles the S3 logic, the frontend will POST to the `file-service` endpoint. Progress will be tracked using `XMLHttpRequest` or `fetch` with a wrapper if needed, but standard browser `fetch` is preferred for simplicity.
- **Alternatives considered**: Direct-to-S3 upload from browser (rejected as it bypasses the `file-service` business logic/metadata tracking).

## Decision: Component Library
- **Choice**: **shadcn/ui** (Tailwind CSS + Radix UI).
- **Rationale**: Mandated by the Project Constitution. Provides high-quality, accessible components that are easy to customize.
