# DevOps Master Playbook: Quy trình Từ Zero đến Production

Tài liệu này không chỉ liệt kê lệnh cài đặt, mà là **Quy trình Tư duy Cốt lõi (DevOps Mindset)**. Đừng mù quáng quăng tất cả lên mây chờ đợi phép màu. Hãy thực hiện Test từng cục (Unit Test) -> Test nguyên xe (Docker Compose) -> Rồi mới mang ra đường đua (AWS Cloud).

---

## GIAI ĐOẠN 0: Khai thiên Lập địa (Dành cho người chưa từng dùng AWS)
*Nếu bạn hoàn toàn mù tịt về AWS, đây là những bước sống còn trước khi gõ bất kì lệnh code nào. Đừng bao giờ bỏ qua.*

1. **Tạo tài khoản AWS Root (Chúa Tể):** 
   - Vào `aws.amazon.com`, bấm **Create an AWS Account**. Làm theo hướng dẫn (Bạn sẽ cần Add thẻ Visa/Mastercard, AWS sẽ gạch tầm $1 để test và trả lại ngay).
2. **Tạo IAM User (Tuyệt đối KHÔNG DÙNG tài khoản Root để code!):**
   - Đăng nhập vào AWS Console bằng tài khoản Root vừa tạo.
   - Gõ lên thanh tìm kiếm ô trên cùng, tìm dịch vụ **IAM (Identity and Access Management)**.
   - Nhìn Menu bên trái, chọn **Users** -> Nhấn nút cam **Create user**. Đặt tên là `devops-admin` -> `Next`.
   - Ở mục Permissions: Chọn **Attach policies directly**. Tìm dòng `AdministratorAccess` check ô vuông bên cạnh -> Nhấn `Next` -> `Create user`.
3. **Lấy Chìa Khóa Quyền Lực (Access Keys):**
   - Click ngược lại vào thằng User `devops-admin` vừa tạo. Chọn Tab **Security credentials**.
   - Kéo xuống phần Access keys, nhấn **Create access key**.
   - Chọn mục **Command Line Interface (CLI)** -> Bấm Create.
   - 🚨 **CẢNH BÁO:** Màn hình sẽ hiện ra 2 chuỗi mã là `Access key ID` và `Secret access key`. Hãy copy hoặc tải nút `.csv` cất thật kĩ. (Làm lộ mã Secret này lên Github, tin tặc sẽ đào Bitcoin làm thẻ Visa của bạn bay màu $50,000 trong 1 đêm).
4. **Trang Bị Nòng Pháo Cho Máy Tính (AWS CLI & Node.js):**
   - Cài đặt phần mềm Node.js và Docker Desktop về máy.
   - Cài đặt phần mềm **AWS CLI** (Lên Google search `AWS CLI install windows/mac` và tải file `.msi/.pkg` về cài next next).
   - Mở Terminal lên gõ: `aws configure`
   - Terminal hỏi `AWS Access Key ID`: Paste chuỗi bạn vừa copy ở Bước 3.
   - Cắm tiếp `Secret Access Key`.
   - Hỏi `Default region name`: Nhập `ap-northeast-1` (Vùng Tokyo Nhật Bản - tốc độ mạng đâm về Việt Nam rất nhanh).
   - Format: Nhập `json` hoặc bấm Enter bỏ qua.
5. **Cài Đặt Ma Thuật CDK:**
   - Mở Terminal mới, gõ: `npm install -g aws-cdk`. Vậy là máy tính của bạn đã chính thức liên thông linh hồn với tài khoản AWS!

---

## GIAI ĐOẠN 1: Local Sanity Check (Kiểm tra Sinh tồn từng Service)
*Mục đích: Đảm bảo code của Lập trình viên không bị lỗi cú pháp, build thành công trước khi ghép nối.*

**Mục tiêu số 1: Vượt qua Unit Test & Build JAR**
Chạy tuần tự trên máy cá nhân hoặc thông qua CI để xác nhận 5 mảnh ghép đều xanh:
```bash
# Gõ liên tục các lệnh sau. Nếu 1 cái báo BUILD FAILURE -> Dừng lại sửa dứt điểm.
cd services/auth-service && mvn clean package 
cd ../member-service && mvn clean package 
cd ../file-service && mvn clean package 
cd ../mail-service && mvn clean package 
cd ../master-service && mvn clean package 
```

**Mục tiêu số 2: Boot Run (Test khởi động chay)**
- Hệ thống cần Database. Hãy bật tạm Local DB: `docker-compose up -d postgres localstack`
- Mở thư mục `member-service`, chạy chay bằng IDE (Intellij/Eclipse) hoặc gõ `mvn spring-boot:run`. 
- Thấy log in ra `Started MemberServiceApplication in 3.14 seconds` tức là máy móc không bị kẹt cổng. Tắt đi.

---

## GIAI ĐOẠN 2: System Integration Test (Hợp luyện toàn hệ thống cục bộ)
*Mục đích: Phải chắc chắn Auth nói chuyện được với Member. File gửi được tin nhắn cho Mail. Mọi thứ vận hành trơn tru ở dưới hạ giới trước khi đem lên Cloud.*

1. **Khởi động LocalStack và DB**
   - Chúng ta dùng file `docker-compose.yml` có sẵn: `docker-compose up -d`
   - Bọn này giả lập hệ thống AWS SNS, SQS, S3 và RDS y hệt thật. Tránh tốn tiền AWS.
2. **Khởi tạo tài nguyên ảo (Run Scripts)**
   - Chạy lệnh `./scripts/localstack-init.sh` (để mồi trước cái "hòm thư ảo" SQS và "loa ảo" SNS).
   - Chạy DB script `./scripts/init-db.sql`.
3. **Mở Postman Test các luồng**
   - Gọi `POST localhost:8084/api/v1/auth/signup` -> Nếu trả về JWT, thành công!
   - Kép tiếp Token đó ném sang `GET localhost:8081/api/v1/members/me` -> Nếu in ra Profile người dùng, chứng tỏ **Auth gọi Member Service thành công**.

*(Khi đã chắc chắn 100% 5 con xe này đều nổ máy hoàn hảo. Chúng ta bắt đầu làm thủ tục Đưa Lên Mây AWS).*

---

## GIAI ĐOẠN 3: AWS Pre-flight & Đổ Móng (Foundation)
*Mục đích: Cấp đất đai bên AWS, rào giậu, và xây kho rỗng.*

1. **Cắm thẻ bài (Auth AWS):** `aws configure` -> Verify bằng lệnh `aws sts get-caller-identity`.
2. **Mồi mạng lưới CDK:** `cdk bootstrap` (Chỉ làm 1 lần duy nhất trong lịch sử dự án).
3. **Mở Đất, Khoanh Vùng & Xây Database:**
   ```bash
   cd infra
   cdk deploy VpcStack-dev RdsStack-dev SnsSqsStack-dev
   ```
4. **Xây Kho chứa Mã Mạch (Chưa Đổ Data):**
   ```bash
   cdk deploy EcrStack-dev
   ```
   *Quá trình này xây cho bạn 5 cái hòm Rỗng. Cực kỳ quan trọng để chuẩn bị cho Giai đoạn 4.*

---

## GIAI ĐOẠN 4: Docker Release (Đóng gói & Chuyển phát nhanh)
*Mục đích: Hóa phép 5 cục `.jar` cục bộ ở GĐ1 thành 5 khối Docker Image và bắn tọt chúng vào 5 cái hòm ECR trên AWS.*

1. Lấy vé qua cửa: 
   ```bash
   aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-northeast-1.amazonaws.com
   ```
2. Build & Bắn hình ảnh (Push) cho cả 5 dịch vụ:
   - File -> Docker -> Push tới `<ACCOUNT-ID>.dkr.ecr.../aws-micro-demo/file-service:latest`.
*(Từ giờ phút này, trên mây của bạn đã có kho mã nguồn sống).*

---

## GIAI ĐOẠN 5: Bật Cầu Dao Mạng (Cloud Compute & Verification)
*Mục đích: Gọi ECS Fargate xuống kho ECR, kéo code ra nổ máy. Mở cổng API Gateway ra thế giới.*

1. **Deploy Cốt lõi Tính Toán:**
   ```bash
   cd infra
   cdk deploy EcsStack-dev CognitoStack-dev ApiGatewayStack-dev
   ```
2. **⚠️ BƯỚC VERIFY SỐNG CÒN ⚠️:**
   - Đừng tin máy móc. Việc có chữ `Deployment Successful` không có nghĩa là App chạy.
   - Truy cập **AWS Console -> ECS -> Cluster (aws-micro-demo-dev)**.
   - Nhìn vào thẻ **Tasks**. Nếu thấy 5 Tasks đang hiển thị chữ `RUNNING` màu xanh, xin chúc mừng! 
   - Nếu bạn thấy `PENDING` rồi nó cứ tắt ngúm đẻ lại con khác (dấu hiệu CrashLoop) -> Bấm sang tab **Logs**. Thường là do sai Port, sai cấu hình DB (lỗi Secret), hoặc thiếu quyền mạng. App Java bị Crash. Bạn phải fix code và lặp lại GĐ 4.
3. **Test API Thực tế Mây:** Nhét URL API Gateway chạy lệnh Signup qua Postman 1 lần nữa. Nếu chạy, Back-end chính thức Done!

---

## GIAI ĐOẠN 6: Hoàn thiện Lớp Áo & Camera Báo Động (Edge & Observability)
1. **Dựng Camera Báo Động:** `cdk deploy CloudWatchStack-dev`
   - Test thử: Chủ động gọi API báo lỗi 500 khoảng 12 lần liền. Xem có Email cảnh báo/Tin nhắn báo lỗi nổ về không.
2. **Ship Giao Diện:** `cdk deploy S3Stack-dev CloudFrontStack-dev`
3. Trỏ Frontend `NEXT_PUBLIC_API_URL` về URL CloudFront API. 
   - Build ra static file và thả tay vào bucket S3 Của Frontend.

🎉 **Toàn bộ hệ thống giờ đây đã tự động khép kín! Thiết lập xong luồng này, bạn đem quăng Giai đoạn 1 & 4 vào `.github/workflows/deploy-aws.yml` để biến nó thành dây chuyền Robot vĩnh cửu.**
