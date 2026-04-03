# Research: Phase 4 AWS Infrastructure

**Status**: Resolved | **Feature**: 005-aws-infra-phase-4

## Key Technical Decisions

### 1. Networking Strategy (VPC)
- **Decision**: Provision a VPC with 10.0.0.0/16 CIDR and 2 AZs.
- **Rationale**: Standard AWS architecture providing high availability for managed services while keeping CIDR simple for demo.
- **NAT Gateway**: Single NAT Gateway in public subnet for outbound traffic from private ECS tasks. 
  - *Alternatives Considered*: NAT Instance (cheaper but less reliable/slower).
  - *Conclusion*: NAT Gateway is more representative of real AWS patterns.

### 2. Compute Architecture (ECS Fargate)
- **Decision**: Use ECS Fargate with Service Discovery (AWS Cloud Map).
- **Rationale**: Eliminates server management, scales automatically based on CPU utilization. Cloud Map provides internal `service.local` DNS for inter-service communication.
- **Scaling**: CPU-based scaling at 70% threshold.

### 3. API Entry & Gateway
- **Decision**: Use HTTP API Gateway (v2) with VPC Link to an internal NLB.
- **Rationale**: Specifically designed for internal routing from public entry points. HTTP API Gateway is 70% cheaper than REST API Gateway and supports built-in CORS and JWT Authorizer for Cognito.
- **Routing**: NLB listeners on distinct ports (8081-8085) mapping to target groups for each of the 5 microservices.

### 4. Persistence & Security
- **Decision**: RDS PostgreSQL 15.4 with db.t3.micro.
- **Rationale**: Minimal instance size for demo while using a current stable version.
- **Security**: Database credentials managed via AWS Secrets Manager with automatic generation of secrets.

### 5. Observability
- **Decision**: Centralized CloudWatch Dashboard with per-service widgets.
- **Rationale**: Provides a "Single Pane of Glass" for monitoring the entire demo cluster metrics.
- **Alarms**: SNS-driven alarms for High CPU, Error Rate, and Dead Letter Queue (DLQ) depth.

## Summary of Technical Risks
- **Cost**: CDK deployments can accrue costs quickly. NAT Gateways and RDS are the primary cost drivers.
- **SES Sandbox**: SES requires manual identity verification which might block testing if not done as a prerequisite.
