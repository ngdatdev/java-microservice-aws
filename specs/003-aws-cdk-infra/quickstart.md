# Quickstart: AWS CDK for LocalStack

Hướng dẫn các bước để deploy hạ tầng AWS cục bộ cho Phase 3.

## 1. Cài đặt công cụ

Đảm bảo bạn đã cài đặt các công cụ sau:
- Node.js & npm
- Docker
- AWS CLI
- `aws-cdk-local` (đã cài đặt trong `infra/package.json`)

## 2. Các bước triển khai

### Bước 1: Khởi động LocalStack
Nếu LocalStack chưa chạy, hãy chạy lệnh sau từ root dự án:
```bash
docker-compose up localstack -d
```

### Bước 2: Bootstrap môi trường CDK
Cần chạy bootstrap lần đầu để CDK chuẩn bị các tài nguyên quản lý nội bộ trên LocalStack:
```bash
cd infra
npx cdklocal bootstrap aws://000000000000/ap-southeast-1
```

### Bước 3: Deploy hạ tầng
```bash
npx cdklocal deploy
```

### Bước 4: Kiểm tra và lưu cấu hình
Khi deploy xong, terminal sẽ in ra các **Outputs** (ARN, URL, ID). Hãy copy các giá trị này và cập nhật vào file `.env` ở root để Microservices có thể sử dụng.

## 3. Lệnh hữu ích

- `npx cdk synth`: Xem template CloudFormation được sinh ra.
- `npx cdklocal destroy`: Xóa toàn bộ hạ tầng đã tạo trên LocalStack.
