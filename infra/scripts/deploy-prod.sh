#!/bin/bash
set -e
echo "Deploying PROD environment..."
npx cdk deploy --all --context env=prod --require-approval never
