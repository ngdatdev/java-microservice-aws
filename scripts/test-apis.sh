#!/bin/bash
echo "Starting E2E API verification sweep..."

# Test member-service
echo "[US3] Pinging Member Service /members"
curl -X POST http://localhost:8081/api/v1/members \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.com","fullName":"Test User","phone":"0123456789","status":"ACTIVE"}' || echo "Member service unreachable"

# Test file upload (Mock S3)
echo -e "\n[US3] Pinging File Service /files/upload"
echo "Dummy content" > ./test-sample.txt
curl -X POST http://localhost:8082/api/v1/files/upload \
  -F "file=@./test-sample.txt" || echo "File service unreachable"
rm ./test-sample.txt

# Test send email (Mock SES)
echo -e "\n[US3] Pinging Mail Service /mails/send"
curl -X POST http://localhost:8083/api/v1/mails/send \
  -H "Content-Type: application/json" \
  -d '{"to":"recipient@demo.com","subject":"Test Email","body":"Hello from mail-service"}' || echo "Mail service unreachable"

echo -e "\nE2E Suite complete."
