# Data Model: Frontend Dashboard

## Entities

### User (Auth)
- **email**: String (Identifier)
- **idToken**: String (JWT)
- **accessToken**: String (JWT)
- **refreshToken**: String (JWT)

### Member
- **id**: UUID (String)
- **fullName**: String
- **email**: String
- **phone**: String
- **status**: Enum (ACTIVE, INACTIVE)
- **createdAt**: ISO Date String

### File
- **id**: UUID (String)
- **originalName**: String
- **size**: Number (Bytes)
- **contentType**: String
- **s3Url**: String (Pre-signed URL)
- **uploadedAt**: ISO Date String

### DashboardStats
- **totalMembers**: Number
- **totalFiles**: Number
- **activeMembers**: Number
- **recentActivities**: Array<Activity>

## Relationships
- **DashboardStats** aggregates data from **Member** and **File** via the `master-service`.
- **Member** actions (Create/Update) trigger SNS notifications listened to by other services.
