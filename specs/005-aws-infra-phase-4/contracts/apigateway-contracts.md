# API Gateway Contracts: AWS Infrastructure (Phase 4)

**Status**: Defined | **Feature**: 005-aws-infra-phase-4

## Public Endpoint
- **Base URL**: `https://[API_GATEWAY_ID].execute-api.[REGION].amazonaws.com`

## Route Mapping Matrix

| Route | Method | Target Port (NLB) | Service | Auth Required |
|---|---|---|---|---|
| `/api/v1/members/{proxy+}` | ANY | 8081 | `member-service` | ✅ JWT (Cognito) |
| `/api/v1/files/{proxy+}` | ANY | 8082 | `file-service` | ✅ JWT (Cognito) |
| `/api/v1/mails/{proxy+}` | ANY | 8083 | `mail-service` | ✅ JWT (Cognito) |
| `/api/v1/auth/{proxy+}` | ANY | 8084 | `auth-service` | ❌ None |
| `/api/v1/master/{proxy+}` | ANY | 8085 | `master-service` | ✅ JWT (Cognito) |

## Headers Required
- **Authorization**: `Bearer [ID_TOKEN]` (for authenticated routes).
- **Content-Type**: `application/json` (standard).

## VPC Link Details
- **Description**: Connects HTTP API Gateway to Internal NLB in private subnets.
- **Protocol**: TCP (all traffic).
- **Subnets**: Public (API Gateway Link), Private (NLB Targets).

## Health Check
- `/api/v1/auth/health` returns `UP` for public verification.
- Internal health checks happen at the NLB/Target Group level for each port.
