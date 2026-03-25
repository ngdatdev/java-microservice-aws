# Demo AWS CDK Infrastructure

This project contains the CDK infrastructure stack for the AWS Microservices Demo.

## Local Development (LocalStack)

To deploy the infrastructure locally:
1. Ensure LocalStack is running via docker-compose (`docker-compose up -d localstack`).
2. Run initial bootstrap:
   ```bash
   npx cdklocal bootstrap
   ```
3. Deploy the stack:
   ```bash
   npx cdklocal deploy --require-approval never
   ```

## AWS Deployment

To deploy to a real AWS environment:
1. Configure your AWS credentials.
2. Run standard bootstrap:
   ```bash
   npx cdk bootstrap
   ```
3. Deploy the stack:
   ```bash
   npx cdk deploy
   ```
