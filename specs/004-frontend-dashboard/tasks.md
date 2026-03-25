# Tasks: Next.js Frontend Dashboard

**Input**: Design documents from `/specs/004-frontend-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Khởi tạo dự án Next.js 14 trong thư mục `frontend/` sử dụng `create-next-app`
- [x] T002 Cấu hình Tailwind CSS và cài đặt shadcn/ui các components cơ bản (Button, Input, Card, Toast)
- [x] T003 [P] Cấu hình biến môi trường (`frontend/.env.local`) trỏ tới các microservice endpoints từ root `.env`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T004 Thiết lập Root Layout và Sidebar navigation components (`frontend/app/layout.tsx`, `frontend/components/layout/sidebar.tsx`)
- [x] T005 [P] Xây dựng Shared API Client (`frontend/lib/api/client.ts`) với xử lý lỗi tập trung và base URL
- [x] T006 [P] Cài đặt Auth Provider và logic lưu trữ/lấy JWT từ LocalStorage (`frontend/lib/auth/context.tsx`)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Authentication & Identity (Priority: P1) 🎯 MVP

**Goal**: Đăng ký và Đăng nhập qua Cognito (thông qua auth-service)

**Independent Test**: Truy cập `/auth/register` để tạo tk, sau đó `/auth/login` để lấy token và vào Dashboard.

### Implementation for User Story 1

- [x] T007 [P] [US1] Xây dựng giao diện trang Đăng ký (`frontend/app/(auth)/register/page.tsx`)
- [x] T008 [P] [US1] Xây dựng giao diện trang Đăng nhập (`frontend/app/(auth)/login/page.tsx`)
- [x] T009 [US1] Tích hợp API auth-service cho flow Login/Register và lưu Token
- [x] T010 [US1] Implement Next.js Middleware để bảo vệ các route dashboard (`frontend/middleware.ts`)

**Checkpoint**: User Story 1 complete - Authentication flow working.

---

## Phase 4: User Story 4 - Aggregated Dashboard (Priority: P1)

**Goal**: Hiển thị thông tin tổng hợp từ master-service

**Independent Test**: Xem trang chủ Dashboard và xác nhận các con số khớp với backend.

### Implementation for User Story 4

- [x] T011 [P] [US4] Xây dựng trang Dashboard chính (`frontend/app/(dashboard)/page.tsx`)
- [x] T012 [US4] Tích hợp API từ `master-service` để hiển thị Stats Cards (Total Members, Files)

---

## Phase 5: User Story 2 - Member Management (Priority: P1)

**Goal**: Quản lý Thành viên (CRUD)

**Independent Test**: Liệt kê, thêm mới và xóa thành viên trên trang `/members`.

- [x] T013 [P] [US2] Xây dựng trang danh sách Thành viên với Table (`frontend/app/(dashboard)/members/page.tsx`)
- [x] T014 [P] [US2] Xây dựng Dialog/Form Thêm/Sửa thành viên sử dụng Zod + React Hook Form (`frontend/components/forms/member-form.tsx`)
- [x] T015 [US2] Tích hợp API CRUD Member từ `member-service` và hiển thị thông báo thành công

---

## Phase 6: User Story 3 - File Storage & S3 Integration (Priority: P2)

**Goal**: Lưu trữ và tải File (S3)

**Independent Test**: Upload file thành công và tải lại được từ danh sách qua pre-signed URL.

### Implementation for User Story 3

- [x] T016 [P] [US3] Xây dựng trang quản lý File (`frontend/app/(dashboard)/files/page.tsx`)
- [x] T017 [P] [US3] Implement Component Upload File với Progress Bar hiển thị trạng thái (`frontend/components/ui/file-uploader.tsx`)
- [x] T018 [US3] Tích hợp API File Service cho việc liệt kê, upload và lấy link download

---

## Phase 7: User Story 5 - Mail Testing (Priority: P3)

**Goal**: Gửi mail test qua microservice

**Independent Test**: Gửi thành công một mail mẫu và nhận được thông báo phản hồi.

### Implementation for User Story 5

- [x] T019 [P] [US5] Xây dựng trang Mail Testing (`frontend/app/(dashboard)/mail/page.tsx`)
- [x] T020 [US5] Thiết lập Form gửi mail và tích hợp với `mail-service`

---

---
 
 ## Phase 8: Polish & Cross-Cutting Concerns
 
 **Purpose**: Improvements that affect multiple user stories
 
 - [x] T021 Thêm Loading states (Skeletons) cho các trang danh sách UI mượt mà hơn
 - [x] T022 Đảm bảo Responsive design cho các kích thước màn hình khác nhau
 - [x] T023 Implement Global Toast notifications cho các lỗi API
 - [x] T024 Chạy validation kiểm tra luồng tích hợp cuối cùng theo `quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Bắt đầu ngay
- **Foundational (Phase 2)**: Phụ thuộc Phase 1 - Chặn các User Stories
- **User Stories (Phase 3-6)**: Phụ thuộc Phase 2 completion. US1 nên làm đầu tiên để có token.

### Parallel Opportunities

- T003 (Env config) có thể làm song song với T001/T002.
- T005 (API Client) và T006 (Auth Provider) có thể làm song song.
- T007 (Register) và T008 (Login) có thể làm song song.
- Các User Stories (US2, US4) có thể làm song song sau khi hoàn thành US1.

---

## Implementation Strategy

### MVP First (User Story 1 & 4)

1. Hoàn thành Setup & Foundational.
2. Hoàn thành Auth (US1) để có quyền truy cập.
3. Hoàn thành Dashboard (US4) để hiển thị số liệu.
4. VALIDATE: Đăng nhập được và thấy Dashboard.
