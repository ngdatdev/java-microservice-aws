# Quickstart: Phase 6 Infrastructure Deployment

## Context & Prerequisites
This module defines the unified infrastructure automation matrix for the AWS microservice demo. 

**Requirements:**
- Node 18+
- AWS CLI configured globally (`aws configure`)
- Docker Desktop running (required if any IaC constructs perform automatic container image builds or assets packaging during synthesis).

## Developer Workflows

### 1. Initialization
You must install all dependencies and bootstrap your AWS account before attempting to synthesize infrastructure.
```bash
cd infra
npm ci
npx cdk bootstrap
```

### 2. Standard Development Deployment
To push the `dev` environment stack (the default parameter mapping):
```bash
npm run deploy:dev
```
*This command invokes `./scripts/deploy-dev.sh` which executes `cdk deploy --all --context env=dev`.*

### 3. Teardown / Destruction
To safely scrub the AWS environment and shut down all billing footprint for the dev environment:
```bash
./scripts/destroy-dev.sh
```

### 4. Cross-Environment Multi-Targeting
To deploy the identical infrastructure topology to a production or staging isolated context:
```bash
npm run deploy:staging # Translates to --context env=staging
```
```bash
npm run deploy:prod    # Translates to --context env=prod
```
