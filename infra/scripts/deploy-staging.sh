#!/bin/bash
set -e
echo "Deploying STAGING environment..."
npx cdk deploy --all --context env=staging --require-approval never
