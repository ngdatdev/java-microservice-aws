# Tasks: AWS CDK Infrastructure

**Input**: Design documents from `/specs/003-aws-cdk-infra/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Initialize `infra/` project dependencies with `npm install`
- [x] T002 [P] Install `aws-cdk-local` as a development dependency in `infra/package.json`

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T003 Execute `npx cdklocal bootstrap` to prepare LocalStack
- [x] T004 [P] Verify base stack entry point in `infra/bin/infra.ts`
- [x] T004a [P] Define VPC in `infra/lib/infra-stack.ts`
- [x] T004b [P] Define RDS Instance in `infra/lib/infra-stack.ts`

## Phase 3: User Story 1 - Local Infrastructure Verification (Priority: P1) 🎯 MVP

**Goal**: Triển khai đầy đủ các tài nguyên SNS, SQS, S3, Cognito lên LocalStack để các Microservices có thể kết nối.

**Independent Test**: Chạy `npx cdklocal deploy` thành công và verify tài nguyên qua AWS CLI.

### Implementation for User Story 1

- [x] T005 [P] [US1] Định nghĩa Messaging Topics (`member-events`, `file-events`) trong `infra/lib/infra-stack.ts`
- [x] T006 [P] [US1] Định nghĩa SQS Queue `mail-queue` và SNS Subscription trong `infra/lib/infra-stack.ts`
- [x] T007 [P] [US1] Định nghĩa S3 Bucket `demo-file-storage` trong `infra/lib/infra-stack.ts`
- [x] T008 [P] [US1] Định nghĩa Cognito User Pool và App Client trong `infra/lib/infra-stack.ts`
- [x] T009 [US1] Chạy `npx cdk synth` để kiểm tra tính hợp lệ của template
- [x] T010 [US1] Chạy `npx cdklocal deploy` để triển khai thực tế lên LocalStack

## Phase 4: User Story 2 - Cloud Deployment Transition (Priority: P2)

**Goal**: Đảm bảo code CDK có thể deploy lên AWS thật mà không cần sửa code.

**Independent Test**: `cdk synth` không báo lỗi khi chuyển sang mode AWS tiêu chuẩn.

### Implementation for User Story 2

- [x] T011 [US2] Thêm logic nhận diện Environment (Account/Region) trong `infra/bin/infra.ts`
- [x] T012 [US2] Kiểm tra `cdk synth` với các target AWS khác nhau (giả lập qua env vars)

## Phase 5: User Story 3 - Automated Resource Provisioning (Priority: P3)

**Goal**: Kiểm tra khả năng so sánh thay đổi (diff) của hạ tầng.

**Independent Test**: Lệnh `cdk diff` hiển thị đúng các thay đổi dự kiến.

### Implementation for User Story 3

- [x] T013 [US3] Chạy thử nghiệm `npx cdklocal diff` sau khi thay đổi một resource nhỏ

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T014 [P] Cập nhật file `.env` ở root với các ARN và Name lấy từ CDK Outputs
- [x] T015 [P] Hoàn thiện tài liệu kiến trúc trong `infra/README.md`
- [x] T016 Verify toàn bộ hệ thống bằng `quickstart.md`

## Dependencies & Execution Order

1. **Setup (Phase 1)** hoàn tất mới sang **Foundational (Phase 2)**.
2. **Phase 2** hoàn tất mới có thể bắt đầu **User Story 1 (Phase 3)**.
3. Các User Story có thể thực hiện song song sau khi Foundation ổn định.
4. **Polish** thực hiện cuối cùng sau khi US1 thành công.
