# Quickstart: AWS Infrastructure (Phase 4)

**Status**: Defined | **Feature**: 005-aws-infra-phase-4

## Prerequisites
- AWS CLI configured with administrator access.
- Node.js 18+ and npm.
- AWS Account ID and Region defined in root `.env`.

## Deployment Steps

### 1. Initialize AWS CDK
```bash
cd infra
npm install
npx cdk bootstrap aws://[ACCOUNT_ID]/[REGION]
```

### 2. Deploy Infrastructure
Deploy all stacks in dependency order:
```bash
npx cdk deploy --all --require-approval never
```

### 3. Post-Deployment Configuration
After a successful deployment, retrieve outputs from the CloudFormation console (or terminal output):
- **Cognito User Pool ID** & **Client ID**: Update root `.env`.
- **API Gateway URL**: Update frontend `.env.local` to point to the new cloud endpoint.
- **RDS Host**: Verify successful creation in RDS console.

### 4. Verification
- **Health Check**: `curl https://[API_GATEWAY_URL]/api/v1/auth/health` should return `UP`.
- **Dashboard**: Log in to AWS Console and check the "aws-micro-demo-dashboard" for initial metrics.
- **Monitoring**: Ensure SNS Alarm notifications are configured via the `AlarmNotificationTopic`.

## Cleanup
To delete all resources and avoid continuing costs:
```bash
npx cdk destroy --all
```
*Note: S3 Buckets and ECR Repositories might require manual cleanup if not empty.*
