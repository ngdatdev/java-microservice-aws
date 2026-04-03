#!/bin/bash
set -e
echo "Deploying DEV environment..."
npx cdk deploy --all --context env=dev --require-approval never
