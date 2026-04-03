#!/bin/bash
set -e
echo "Destroying DEV environment..."
npx cdk destroy --all --context env=dev --force
