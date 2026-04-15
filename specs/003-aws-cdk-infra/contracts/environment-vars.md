# Infrastructure Contracts: Environment Variables

Mô tả các biến môi trường mà Java Microservices cần để kết nối với hạ tầng đã được tạo.

## 1. Biến chung (Common)

| Tên Biến | Mô tả | Giá trị Mặc định (LocalStack) |
|----------|-------|-----------------------------|
| `AWS_ENDPOINT` | Endpoint cho AWS Clients | `http://localhost:4566` |
| `AWS_REGION` | Vùng triển khai | `ap-southeast-1` |

## 2. Biến theo Service

### Member Service
- `MEMBER_EVENTS_TOPIC_ARN`: ARN của SNS Topic `member-events`.

### File Service
- `FILE_EVENTS_TOPIC_ARN`: ARN của SNS Topic `file-events`.
- `FILE_STORAGE_BUCKET_NAME`: Tên S3 Bucket `demo-file-storage`.

### Mail Service
- `MAIL_QUEUE_URL`: URL của SQS Queue `mail-queue`.

### Auth Service
- `USER_POOL_ID`: ID của Cognito User Pool.
- `USER_POOL_CLIENT_ID`: ID của Cognito App Client.

## 3. Cách lấy giá trị sau khi Deploy

Sau khi chạy `cdklocal deploy`, các giá trị này sẽ xuất hiện trong phần **Outputs** của terminal. Cần cập nhật các giá trị này vào file `.env` ở root dự án.
