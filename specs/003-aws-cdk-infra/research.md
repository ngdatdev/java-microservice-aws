# Research: Phase 3 AWS CDK Infrastructure

Mục tiêu nghiên cứu các rào cản kỹ thuật khi triển khai CDK lên LocalStack.

## 1. Cognito và Auth Flows trong CDK

- **Vấn đề**: Config `ADMIN_NO_SRP_AUTH` trong CDK.
- **Kết quả**: 
    - Trong CDK v2, interface `AuthFlows` sử dụng `adminUserPassword: true` để kích hoạt `ADMIN_USER_PASSWORD_AUTH`.
    - LocalStack (v3+) hỗ trợ đầy đủ Cognito Identity Provider. Cần đảm bảo `USER_PASSWORD_AUTH` cũng được bật để Java SDK có thể đăng nhập dễ dàng trong môi trường demo.
- **Quyết định**: Bật cả `userPassword`, `adminUserPassword` và `custom` flows.

## 2. cdklocal và Bootstrap

- **Vấn đề**: Sự khác biệt giữa `cdk` và `cdklocal`.
- **Kết quả**:
    - `cdklocal` là wrapper tự động cấu hình các endpoint AWS CLI về `http://localhost:4566`.
    - Cần chạy `cdklocal bootstrap aws://000000000000/ap-southeast-1` trước khi deploy lần đầu.
- **Quyết định**: Sử dụng `cdklocal` cho mọi thao tác deploy cục bộ.

## 3. VPC và Networking trong LocalStack

- **Vấn đề**: VPC có thực sự cần thiết trong LocalStack?
- **Kết quả**:
    - LocalStack giả lập VPC nhưng không thực sự thực thi các giới hạn mạng phức tạp trừ khi dùng bản Pro.
    - Tuy nhiên, để code CDK "Cloud-ready", việc định nghĩa VPC là bắt buộc để sau này deploy lên AWS thật không bị lỗi thiếu network.
- **Quyết định**: Tạo VPC với 1 Public Subnet và 1 Private Subnet.
