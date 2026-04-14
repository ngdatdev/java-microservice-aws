#!/usr/bin/env bash
# ================================================
# Bootstrap Cognito User Pool on LocalStack
# Run this ONCE after starting LocalStack
# ================================================

set -e

AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=ap-northeast-1
AWS_ENDPOINT_URL=http://localhost:4566

POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name demo_pool \
  --query "UserPool.Id" \
  --output text \
  --endpoint-url "$AWS_ENDPOINT_URL")

echo "User Pool ID: $POOL_ID"

CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id "$POOL_ID" \
  --client-name demo_client \
  --generate-secret \
  --query "UserPoolClient.ClientId" \
  --output text \
  --endpoint-url "$AWS_ENDPOINT_URL")

echo "App Client ID: $CLIENT_ID"
echo
echo "Add these to your environment:"
echo "  export COGNITO_USER_POOL_ID=$POOL_ID"
echo "  export COGNITO_CLIENT_ID=$CLIENT_ID"
