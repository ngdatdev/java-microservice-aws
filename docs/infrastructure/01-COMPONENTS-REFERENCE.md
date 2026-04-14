# Sách Lược Thành Phần Hệ Thống (Components Deep-Dive)

Tài liệu này bóc tách chi tiết từng cụm tài nguyên AWS trong hệ thống của chúng ta. Nắm vững bản chất của các cụm này là yếu tố sống còn để bạn có thể scale, debug, và duy trì hệ thống trong môi trường Production.

---

## 1. 🛡️ VPC & Networking (The Skeleton)
*Ranh giới vật lý tuyệt đối của toàn bộ dữ liệu.*

- **VPC (`10.0.0.0/16`):** Vùng phủ sóng mạng độc lập. Chúng ta chia ra 2 Availability Zones (AZ) để chống chết server (nếu data center AWS A bị chập điện, AZ B tự gánh tải).
- **Public Subnet:** Chứa ALB và NAT Gateway. Nhìn chung rất ít tài nguyên nào nằm ở đây vì nó lộ ra Internet.
- **Private Subnet:** Chứa ECS Fargate, NLB, RDS. Gần như vô hình từ bên ngoài.
- **NAT Gateway (Cost-saving mode):** Giá thiết lập 1 NAT Gateway trên AWS khoảng ~$32/tháng. Ở chế độ tối ưu hiện tại, chúng ta chỉ dựng **1 NAT Gateway (thay vì 2 cái trên 2 AZ)**. *Lưu ý: Nếu lên Production xịn, bạn cần đổi biến `maxAzs: 2` và `natGateways: 2` trong file `vpc-stack.ts` để đạt chuẩn High Availability tuyệt đối.*
- **Security Groups (SG):** Chúng ta có 4 SGs.
  - `alb-sg`: Tiếp đón port 80/443 từ Public `0.0.0.0/0`.
  - `ecs-sg`: Không hề mở ra Public. Nó chỉ nhận kết nối vào port 8081-8085 nếu gốc gác (Source) đến từ thằng `nlb-sg` hoặc `alb-sg`.
  - `rds-sg`: Khóa chết. Chỉ bọn nào đeo huy hiệu `ecs-sg` mới được chui vào màng port 5432.

---

## 2. 🐳 Compute: ECS Fargate (The Muscles)
*Trái tim vận hành Logic Business của hệ thống.*

- **Fargate vs EC2:** Chúng ta chọn mô hình chạy Serverless (Fargate). Lợi ích lớn nhất là bạn không phải bảo trì Hệ điều hành, không lo chuyện vá lỗi bảo mật Linux, và không phải nhức đầu phân tích RAM bao nhiêu là đủ cho Server. Container xài bao nhiêu AWS tính tiền bấy nhiêu.
- **Task Definition:** Mỗi service (`Member`, `Auth`...) được cấp một máy chủ mini (CPU: 256, Mem: 512MB). Khi tải tăng, con số `desiredCount` nhảy từ 1 lên 10, AWS tự động bật thêm 9 cái Container nhỏ trong tích tắc.
- **Cloud Map (`service.local`):** 
  - Tại sao Auth Service gọi được cho Member Service? AWS Cloud Map sinh ra một dịch vụ "Danh bạ Điện thoại" nội bộ DNS. 
  - Khi code gõ `http://member-service.service.local:8081/api/...`, DNS tự hiểu và gọi sang cái Container Fargate kia mà không chui lọt ra Internet.

---

## 3. 💾 Data & Persistence (The Memory)
*Nơi ký ức hệ thống được lưu giữ.*

- **RDS (PostgreSQL):** 
  - AWS tự động lo liệu việc backup hằng ngày (`backupRetention: 1 day`). 
  - Data Base không có mật khẩu nào bị lộ vì được mã hóa và chôn giấu thông qua AWS KMS ở `storageEncrypted: true`.
- **S3 (Simple Storage Service):** 
  - Chúng ta có 2 Bucket. Một cái cho Static Web (Frontend), một cái cho User Upload (File Service).
  - Web bucket bị `BlockPublicAccess`. 
  - File Service bucket được kích hoạt CORS vì đôi khi ứng dụng React Frontend ở trình duyệt sẽ gửi thẳng file ảnh (Upload) đâm vào S3 thông qua *Presigned URLs* (để File Server không bị nghẽn băng thông do cõng file to).

---

## 4. 🔏 Identity & API Layer (The Gatekeeper)
*Cánh cổng duy nhất chạm vào thế giới ngầm.*

### Cụm Auth (Cognito)
- **User Pool:** Xứ giả phân quyền. Nó quản trị vòng đời Token, Đổi mật khẩu, OTP. 
- Mọi logic xác thực phức tạp (Google Login, MFA/2FA, Quên mật khẩu) tương lai sẽ ủy thác toàn bộ cho Cognito. Backend của ta rất nhàn rỗi.

### Cụm API (API Gateway + VPC Link)
Đây được mệnh danh là kiệt tác phòng thủ trong Microservice.
- 100% Request của User gõ vào `api.domain.com` sẽ đâm trúng API Gateway.
- API Gateway sẽ cầm bức thư đấy, giơ Token lên cho Cognito xét duyệt.
- Nếu Pass, nó dẫn traffic đó đi chui thẳng tay vào **VPC Link**.
- VPC Link như một mũi tiêm chọc xuyên màn bảo vệ Private Subnet, bơm vào Internal Master Router (NLB). Từ NLB rẽ đi theo từng đường ống 8081..8085 tới đúng Service.

---

## 5. 📨 Messaging (The Nerves)
*Sợi dây thần kinh nối kết hệ sinh thái chằng chịt.*

- Nếu `File-Server` và `Mail-Server` gọi chung nhau bằng API (REST HTTP) liên tục, khi Mail-Server đang tạm chết, người dùng sẽ không up được file. Nhức đầu!
- Do đó, chúng ta đẻ ra **Event-Driven Architecture (SNS/SQS)**.
- `File-Server` nhận upload xong thì quát một tiếng lên Loa phường **(SNS)**: *"Dân làng ơi, ông X mới đưa tôi 1 báo cáo!"*. Nó đếch thèm quan tâm ai nghe.
- `Mail-Server` là ông chuyên đi hóng chuyện. Nó đặt một cái Hòm thu âm **(SQS)** dính vào cái Loa ấy. Tin nhắn rơi tõm vào Hòm. Lúc rảnh rỗi nó ra lôi ra xem (Poll), a ha, có tin nhắn mới, ta gửi Email cho Sếp đây.
- Nỡ may Mail-Server bị Crash, tin nhắn ấy không mất! Nó nằm yên trong cái Hòm Thư Chờ SQS (vàng khè). 3 ngày sau Mail-Server sống lại mới lôi ra gửi tiếp vẫn duyệt! 

Thất bại 3 lần? Tin nhắn rơi xuống thùng rác **DLQ (Dead Letter Queue)**, AWS CloudWatch la toáng lên báo chuông cho DevOps vào tận nơi nhặt rác dọn dẹp bằng tay. Kín kẽ tuyệt đối.

---

## 6. 🚀 CI/CD Lifecycle: GitHub Actions (The Factory)
*Dây chuyền lắp ráp và xuất xưởng tự động.*

- **Verify (Thử nghiệm)**: Trước khi được phép "lên Mây", code phải vượt qua bài kiểm tra Build Java (Maven) + Build Frontend (npm). Lưu ý đặc biệt là bước `cdk synth` — nếu bạn viết sai code hạ tầng làm gãy sơ đồ logic, Pipeline sẽ tự ngắt, không cho phép phá hỏng hệ thống đang chạy.
- **Ship (Đóng gói)**: Docker Image được build và tag theo **Git Commit SHA**. Điều này cực kỳ quan trọng cho việc Rollback. Nếu bản update mới bị lỗi, bạn chỉ cần chỉ định quay lại mã SHA cũ là xong, không đoán già đoán non.
- **Deploy (Phát hành)**: Lệnh `cdk deploy` được thực thi với tham số `--context env=dev`. Nó sẽ so sánh sự khác biệt (Diff) giữa trên Mây và dưới Code, chỉ cập nhật những gì thay đổi để tiết kiệm thời gian.

---
🚀 **Kết luận**: Hệ thống của chúng ta không đơn thuần là vài dòng code Java, nó là một thực thể sống động được bao bọc bởi mạng lưới bảo mật và tự động hóa tầng tầng lớp lớp của AWS. Hãy tận hưởng sức mạnh này!
