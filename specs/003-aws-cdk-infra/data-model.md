# Resource Model: AWS CDK Infrastructure

Mô tả mối quan hệ giữa các tài nguyên AWS được định nghĩa trong stack.

## 1. Sơ đồ tài nguyên (Resource Relationships)

```mermaid
graph TD
    subgraph "VPC (Core-Network)"
        VPC[VPC]
        Subnet1[Public Subnet]
        Subnet2[Private Subnet]
    end

    subgraph "Storage & Database"
        S3[S3: demo-file-storage]
        RDS[RDS: PostgreSQL]
    end

    subgraph "Messaging"
        SNS_Member[SNS: member-events]
        SNS_File[SNS: file-events]
        SQS_Mail[SQS: mail-queue]
        SQS_Audit[SQS: audit-queue]
        
        SNS_Member --> SQS_Mail
        SNS_Member --> SQS_Audit
    end

    subgraph "Auth"
        Cognito[Cognito User Pool]
        AppClient[App Client]
    end

    MemberService[Member Service] --> SNS_Member
    FileService[File Service] --> SNS_File
    FileService --> S3
    MailService --> SQS_Mail
    AuthService --> Cognito
    MasterService --> RDS
```

## 2. Danh sách tài nguyên (Entities)

- **VPC Entity**: Đóng vai trò là "container" cho toàn bộ hệ thống.
- **Messaging Entities**:
    - `member-events`: Topic truyền tin khi có sự thay đổi member.
    - `mail-queue`: Queue lắng nghe từ topic để kích hoạt gửi mail.
- **Storage Entities**:
    - `demo-file-storage`: Lưu trữ file vật lý (PDF, Image).
- **Identity Entities**:
    - `demo-user-pool`: Quản lý danh tính người dùng.
