# DevOps Master Playbook: AWS Cloud-Native Microservices

Chào mừng đến với tài liệu vận hành cốt lõi của hệ thống. Tài liệu này được thiết kế theo tư duy của một **Senior DevOps Engineer**, nhắm tới việc tổ chức, chuẩn hóa và tự động hóa toàn bộ vòng đời của hạ tầng (Infrastructure as Code - IaC) cũng như quá trình 배포 (Deployment).

---

## 1. Triết lý Tổ chức (DevOps Philosophy)

Hệ thống của chúng ta áp dụng các chuẩn mực Enterprise:
1. **Infrastructure as Code (IaC):** Mọi tài nguyên AWS 100% phải được định nghĩa bằng mã (AWS CDK). Không ai được phép dùng chuột bấm tạo tài nguyên trên giao diện AWS Console. Điều này đảm bảo tính tái sử dụng và chống trôi dạt cấu hình (Config Drift).
2. **Immutable Infrastructure:** Khi có bản cập nhật, chúng ta tạo ra Container Image mới và thay thế Container cũ, tuyệt đối không chui (SSH/Exec) vào Container đang chạy để sửa code.
3. **Least Privilege:** Mọi luồng giao tiếp mạng phải khóa kín mặc định. Service A gọi Service B phải có rule Security Group mở riêng. 
4. **Secret Management:** Mật khẩu Database, API Keys KHÔNG BAO GIỜ nằm trong mã nguồn hay biến môi trường tĩnh. Phải bốc từ AWS Secrets Manager tại thời điểm khởi động máy chủ (runtime).

---

## 2. Quy hoạch Thư mục (Where things live)

Để tránh hệ thống biến thành một mớ hỗn độn khi dự án phình to, chúng ta quy định chặt chẽ nơi lưu trữ:

| Loại File | Vị trí thư mục | Quy tắc / Best Practice |
|:---|:---|:---|
| **Mã nguồn Hạ tầng (IaC)** | `infra/lib/` | Chia nhỏ thành từng Stack riêng biệt (VPC, RDS, ECS...) theo nguyên tắc "Single Responsibility". Nếu gom chung vào 1 file, sau này cập nhật rất dễ bị kẹt (update deadlock). |
| **Scripts tự động hóa** | `scripts/` (Root) hoặc `infra/scripts/` | Chứa các file `*.sh` (Linux/Mac) hoặc `*.ps1` (Windows) dùng để chạy pipeline, clear cache, hay seed database. Ví dụ: `deploy_all.sh`. |
| **Biến môi trường App** | `services/*/src/main/resources/application.yml` | Cấu hình cho App Spring Boot. Chia profile (vd: `application-dev.yml`, `application-prod.yml`). Các thông tin nhạy cảm phải gọi từ `${ENV_VAR}`. |
| **Github Actions (CI/CD)** | `.github/workflows/` | Nơi lưu trữ các kịch bản chạy tự động. Tách riêng `ci-build.yml` (chỉ chạy test, build jar) và `cd-deploy.yml` (đẩy lên AWS). |

---

## 3. Lộ trình Triển khai Chuẩn (The Master Deployment Lifecycle)

Khi dựng một môi trường hoàn toàn mới (ví dụ môi trường `Staging` hay `Prod`), phải tuyệt đối tuân thủ theo luồng sau để tránh lỗi "Con gà - Quả trứng" (Circle Dependencies):

### Phase 1: Mở đất & Đổ móng (Foundation & Security)
1. **Chuẩn bị môi trường:** 
   - AWS Account, IAM User có quyền AdministratorAccess.
   - Chạy `cdk bootstrap` để chuẩn bị môi trường CDK.
2. **Deploy Networking:** `cdk deploy VpcStack-<env>`
   - *Mục đích:* Tạo ranh giới mạng cô lập, NAT Gateway để đi ra Internet an toàn.
3. **Deploy ECR:** `cdk deploy EcrStack-<env>`
   - *Mục đích:* Tạo trước các kho chứa Docker Image rỗng. Nếu không làm trước, Phase Compute sẽ sụp đổ.

### Phase 2: Đóng gói Phần mềm (Build & Push Images)
*Ở bước này, CI/CD Pipeline (GitHub Actions) thường đảm nhận, nhưng nếu chạy tay:*
1. Build file JAR: `mvn clean package` cho cả 5 microservices.
2. Build Docker Images: `docker build -t aws-micro-demo/<service-name> .`
3. Push cờ lên AWS: Login ECR -> Tag Image -> Push lên ECR. Đảm bảo Image nằm sãn trên Cloud.

### Phase 3: Gọi dữ liệu (Persistence Layer)
1. **Deploy RDS:** `cdk deploy RdsStack-<env>`
   - *Mục đích:* Khởi tạo PostgreSQL Database. Nó sẽ tự động sinh mật khẩu siêu việt và giấu vào Secrets Manager. Nhờ có VPC tạo ở Phase 1, con DB này yên vị trong Private Subnet.
2. **Deploy Storage (S3 & SNS/SQS):** `cdk deploy S3Stack SnsSqsStack`
   - *Mục đích:* Chuẩn bị ống cống tin nhắn (Messaging bus) và kho lưu trữ vật lý cho ứng dụng.

### Phase 4: Khởi động Động cơ (Compute & Authentication)
1. **Deploy Cognito:** `cdk deploy CognitoStack-<env>`
   - *Mục đích:* Dựng máy chủ quản lý người dùng.
2. **Deploy ECS:** `cdk deploy EcsStack-<env>`
   - *Bước nguy hiểm nhất:* Bước này yêu cầu Image (Phase 2), DB (Phase 3), VPC (Phase 1) phải quy tụ đầy đủ. Fargate sẽ kéo code của bạn về, cắm vào DB, chọc vào SNS, và chạy lên cổng 8081-8085.

### Phase 5: Mở cổng Đón khách (API Layer & Edge)
1. **Deploy API Gateway:** `cdk deploy ApiGatewayStack-<env>`
   - *Mục đích:* Mở cánh cổng HTTPS ra thế giới. Cổng này sẽ kiểm tra Token của Cognito (Phase 4), nếu hợp lệ, nó chui qua VPC Link đâm vào ECS Fargate.
2. **Deploy CloudFront Front-end:** `cdk deploy CloudFrontStack-<env>`
   - Build Source React/Next.js ra static file.
   - Quăng lên Bucket `S3_FE`.
   - Bật CDN phân phối đi cả thế giới.

---

## 4. CI/CD Automation (Đã được Setup sãn)

Hệ thống của chúng ta đã được trang bị **GitHub Actions Continuous Deployment** nằm tại `.github/workflows/deploy-aws.yml`. Pipeline này sẽ tự động thay bạn làm mọi việc thủ công khi có người Push lên nhánh `main`.

### 🚨 Cảnh báo sống còn: Thiết lập Khóa Tự động hóa (Automation Secrets)
Để GitHub có đặc quyền chạy các lệnh thay thế cho máy của bạn trên môi trường mạng của AWS, bạn **BẮT BUỘC** phải cấp thẻ bài bí mật. Nếu quên bước này, Job Deploy sẽ nổ lỗi Đỏ lòe ngay từ bước Setup.

Vào trình duyệt web mở kho code trên Github > Chọn **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.
Hãy thêm đủ 2 biến vô cùng quan trọng:

1. `AWS_ACCESS_KEY_ID`: ID thẻ chìa khóa sinh ra từ tài khoản IAM AWS với quyền Admin.
2. `AWS_SECRET_ACCESS_KEY`: Mật mã đi kèm chìa khóa đó.

### Phương thức Pipeline Hoạt động (Zero-Downtime Deployment)
1. **Verify Code `Job 1`**: GitHub tải máy ảo Java 17, chạy Unit Tests và Build file JAR. Nó đóng vai trò Cảnh cửa an toàn (Gatekeeper). Nếu một đồng nghiệp Push code sai cú pháp Java, tiến trình lập tức báo Cancel, AWS của bạn vẫn sống an toàn.
2. **Build ECR `Job 2`**: Bọc file JAR vào Docker, đặt tên thẻ (Tag) tuân thủ theo mã Git Commit Hash để Tracking siêu dễ dàng, sau đấy đẩy thẳng cái cục Docker hầm hố này lên mây (ECR).
3. **CDK Deploy `Job 3`**: Load mã nguồn IaC với NodeJS 18, gõ lệnh `cdk deploy --all` đẩy mọi thứ lên thẳng Cloud. Trái tim rủng rỉnh ECS Cluster sẽ nhận ra có Image mới trong chớp mắt và thực hiện **Rolling Update**. Nghĩa là server cũ vẫn đứng tiếp khách, trong khi server mới lẳng lặng khởi động chờ sẵn, server mới nóng máy ok rồi thì server cũ tự khắc rút lui! Đạt chuẩn Enterprise thực thi chớp nhoáng không có Downtime!
