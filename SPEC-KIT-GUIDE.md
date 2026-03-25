# 📘 Hướng dẫn sử dụng Spec-Kit (SDD)

Chào mừng bạn đến với quy trình phát triển dựa trên đặc tả (Spec-Driven Development) cùng **Antigravity**. Các công cụ đã được đánh số thứ tự để bạn dễ dàng theo dõi luồng công việc.

---

## 🚀 Luồng công việc chính (Core Workflow)

Hãy thực hiện theo thứ tự các bước sau đây cho mỗi tính năng hoặc Phase mới:

### Bước 1: Thiết lập quy tắc dự án
**Lệnh**: `/1-speckit.constitution`
- **Mục đích**: Xác định các nguyên tắc kiến trúc và tiêu chuẩn code (Java 17, Spring Boot, AWS CDK...).
- **Khi nào dùng**: Chỉ cần làm 1 lần ở đầu dự án hoặc khi có thay đổi lớn về quy định chung.

### Bước 2: Tạo bản đặc tả tính năng
**Lệnh**: `/2-speckit.specify [Mô tả tính năng]`
- **Mục đích**: Tôi sẽ tạo một **nhánh Git mới** và file `specs/[branch]/spec.md`.
- **Nội dung**: Bao gồm User Stories, Functional Requirements và Acceptance Criteria.
- **Lưu ý**: Hãy đọc kỹ file `spec.md` này để đảm bảo tôi hiểu đúng ý bạn trước khi sang bước tiếp theo.

### Bước 3: Lập kế hoạch thực hiện
**Lệnh**: `/3-speckit.plan [Công nghệ/Kiến trúc]`
- **Mục đích**: Chuyển đặc tả nghiệp vụ thành thiết kế kỹ thuật (`plan.md`).
- **Nội dung**: Lựa chọn Database, API Endpoints, cấu trúc thư mục và bảo mật.

### Bước 4: Chia nhỏ danh sách Task
**Lệnh**: `/4-speckit.tasks`
- **Mục đích**: Tự động chuyển đổi `plan.md` thành một danh sách công việc chi tiết trong `tasks.md`.
- **Nội dung**: Các bước thực thi nhỏ nhất, có thể đánh dấu hoàn thành `[x]`.

### Bước 5: Thực thi và viết Code
**Lệnh**: `/5-speckit.implement`
- **Mục đích**: Tôi sẽ bắt đầu gõ code thực tế, tạo file và triển khai từng task đã liệt kê.
- **Kết quả**: Code hoàn chỉnh bám sát theo Spec và Plan ban đầu.

---

## 🛠️ Các công cụ hỗ trợ khác

- **`/6-speckit.analyze`**: Kiểm tra sự nhất quán giữa Spec, Plan và Tasks (đảm bảo không làm thiếu yêu cầu).
- **`/7-speckit.checklist`**: Tạo các bảng kiểm tra chất lượng (ví dụ: checklist cho Requirements).
- **`/8-speckit.clarify`**: Kích hoạt khi yêu cầu quá mơ hồ, tôi sẽ hỏi bạn các tùy chọn A, B, C.
- **`/9-speckit.taskstoissues`**: Đẩy các task lên GitHub Issues (nếu bạn có kết nối GitHub).

---

## 📂 Cấu trúc thư mục SDD
- **`.specify/`**: Chứa "trí nhớ" (Constitution) và các mẫu (Templates) của quy trình.
- **`specs/`**: Nơi lưu trữ hồ sơ của từng tính năng. Mỗi folder con tương ứng với 1 nhánh (branch).
- **`.agent/`**: Chứa các bí kíp (Commands & Skills) giúp tôi thực hiện các lệnh trên.

---

## 💡 Ví dụ minh họa: Triển khai tính năng "Thêm Thành Viên"

Dưới đây là chuỗi câu lệnh bạn sẽ nhập để làm việc cùng tôi:

1. **Bước đặc tả (Specify)**:
   > **Bạn**: `/2-speckit.specify Xây dựng tính năng thêm thành viên mới vào hệ thống, bao gồm lưu email, tên và số điện thoại vào database PostgreSQL.`
   >
   > **Tôi**: Sẽ tạo branch `002-add-member` và file `spec.md`. Bạn chỉ cần kiểm tra lại các điều kiện chấp nhận (Acceptance Criteria) trong đó.

2. **Bước lập kế hoạch (Plan)**:
   > **Bạn**: `/3-speckit.plan Sử dụng Spring Boot JPA cho backend, bảng 'members' trong RDS, email là khóa duy nhất.`
   >
   > **Tôi**: Sẽ tạo file `plan.md` liệt kê các class cần tạo (Entity, Repository, Controller) và các bước cấu hình.

3. **Bước chia Task (Tasks)**:
   > **Bạn**: `/4-speckit.tasks`
   >
   > **Tôi**: Tự động tạo file `tasks.md` với các đầu việc như: 
   > - [ ] Tạo Entity Member.java
   > - [ ] Thiết lập Repository
   > - [ ] Viết API endpoint POST /api/members
   > - [ ] Viết Unit Test cho Controller.

4. **Bước thực thi (Implement)**:
   > **Bạn**: `/5-speckit.implement`
   >
   > **Tôi**: Bắt đầu viết code cho từng file, chạy thử và đánh dấu hoàn thành vào checklist cho đến khi xong toàn bộ tính năng.

---

---
*Chúc bạn có trải nghiệm lập trình hiệu quả cùng Spec-Kit!*
