# Implementation Plan: AWS CDK Infrastructure

**Branch**: `003-aws-cdk-infra` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-aws-cdk-infra/spec.md`

## Summary

Triển khai hạ tầng AWS dưới dạng Code (IaC) sử dụng AWS CDK v2 để hỗ trợ 5 microservices. Hạ tầng bao gồm VPC, SNS, SQS, S3 và Cognito, có khả năng chạy cả trên LocalStack và AWS Cloud.

## Technical Context

**Language/Version**: TypeScript 5.x | AWS CDK v2
**Primary Dependencies**: `aws-cdk-lib`, `constructs`, `aws-cdk-local`
**Storage**: AWS S3 (demo-file-storage), RDS PostgreSQL (demo-db)
**Testing**: `cdk synth`, `jest`
**Target Platform**: AWS Cloud / LocalStack (Emulator)
**Project Type**: Infrastructure-as-Code (IaC)
**Performance Goals**: Synthesis < 30s, Local Deploy < 2m
**Constraints**: Phải tương thích hoàn toàn với LocalStack v3
**Scale/Scope**: 5 Microservices, 4 core AWS services (S3, SNS, SQS, Cognito)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle III (Tech Stack)**: Sử dụng AWS CDK v2 (TypeScript) -> Đạt.
- [x] **Principle IV (Ports)**: Cấu hình tài nguyên hỗ trợ các port đã chuẩn hóa (8081-8085) -> Đạt.
- [x] **Principle V (Security)**: Sử dụng Managed Services (Cognito, S3, SNS/SQS) -> Đạt.
- [x] **Infrastructure Constraint**: Sử dụng LocalStack và cdklocal để verify -> Đạt.

## Project Structure

### Documentation (this feature)

```text
specs/003-aws-cdk-infra/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Research on LocalStack limitations
├── data-model.md        # Resource relationship diagram
└── tasks.md             # Task breakdown
```

### Source Code (repository root)

```text
infra/
├── bin/
│   └── infra.ts         # App entry point
├── lib/
│   └── infra-stack.ts   # Main stack definition
├── package.json
└── tsconfig.json
```

**Structure Decision**: Cấu trúc Monorepo tiêu chuẩn với thư mục `infra/` chứa toàn bộ mã nguồn CDK.

## Complexity Tracking

*No violations identified.*
