@echo off
REM ================================================
REM Bootstrap Cognito User Pool on LocalStack
REM Run this ONCE after starting LocalStack
REM ================================================

set AWS_ACCESS_KEY_ID=test
set AWS_SECRET_ACCESS_KEY=test
set AWS_DEFAULT_REGION=ap-northeast-1
set AWS_ENDPOINT_URL=http://localhost:4566

echo Creating Cognito User Pool...
aws cognito-idp create-user-pool ^
  --pool-name demo_pool ^
  --query "UserPool.Id" ^
  --output text

echo.
echo Pool created. Set COGNITO_USER_POOL_ID to the above value.
echo.
echo Creating App Client...
for /f "delims=" %%i in ('aws cognito-idp create-user-pool --pool-name demo_pool --query "UserPool.Id" --output text') do set POOL_ID=%%i

aws cognito-idp create-user-pool-client ^
  --user-pool-id %POOL_ID% ^
  --client-name demo_client ^
  --generate-secret ^
  --query "UserPoolClient.ClientId" ^
  --output text

echo.
echo Done. Add these to your environment:
echo   COGNITO_USER_POOL_ID=%POOL_ID%
echo   COGNITO_CLIENT_ID=<client id from above>