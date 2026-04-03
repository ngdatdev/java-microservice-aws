#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { SnsSqsStack } from '../lib/sns-sqs-stack';
import { EcrStack } from '../lib/ecr-stack';
import { RdsStack } from '../lib/rds-stack';
import { EcsStack } from '../lib/ecs-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { ApiGatewayNlbStack } from '../lib/apigateway-nlb-stack';
import { S3Stack } from '../lib/s3-stack';
import { CloudFrontStack } from '../lib/cloudfront-stack';
import { CloudWatchStack } from '../lib/cloudwatch-stack';

const app = new cdk.App();

const envName = app.node.tryGetContext('envName') ?? 'dev';
const awsAccount = process.env.CDK_DEPLOY_ACCOUNT ?? process.env.CDK_DEFAULT_ACCOUNT ?? '000000000000';
const awsRegion = process.env.CDK_DEPLOY_REGION ?? process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1';

const env: cdk.Environment = { account: awsAccount, region: awsRegion };
const stackProps = { env, envName };

// ─── Phase 1: Foundation ───────────────────────────────────────────────────────

// T004/T007-T009: VPC, subnets, and security groups
const vpcStack = new VpcStack(app, `VpcStack-${envName}`, { ...stackProps });

// T005: SNS Topics + SQS Queues (independent of VPC)
const snsSqsStack = new SnsSqsStack(app, `SnsSqsStack-${envName}`, { ...stackProps });

// T006: ECR repositories for all 5 services (independent)
const ecrStack = new EcrStack(app, `EcrStack-${envName}`, { ...stackProps });

// ─── Phase 2: Persistence ──────────────────────────────────────────────────────

// T010-T012: RDS PostgreSQL — depends on VPC
const rdsStack = new RdsStack(app, `RdsStack-${envName}`, {
  ...stackProps,
  vpc: vpcStack.vpc,
  ecsSg: vpcStack.ecsSg,
  rdsSg: vpcStack.rdsSg,
});
rdsStack.addDependency(vpcStack);

// ─── Phase 3: Compute ──────────────────────────────────────────────────────────

// T013-T016: ECS Cluster, Services, ALB, NLB — depends on VPC, ECR, RDS
const ecsStack = new EcsStack(app, `EcsStack-${envName}`, {
  ...stackProps,
  vpc: vpcStack.vpc,
  albSg: vpcStack.albSg,
  ecsSg: vpcStack.ecsSg,
  nlbSg: vpcStack.nlbSg,
  repositories: ecrStack.repositories,
  dbSecret: rdsStack.dbSecret,
});
ecsStack.addDependency(vpcStack);
ecsStack.addDependency(ecrStack);
ecsStack.addDependency(rdsStack);

// ─── Phase 4: Auth & API ───────────────────────────────────────────────────────

// T017: Cognito User Pool & Client (independent)
const cognitoStack = new CognitoStack(app, `CognitoStack-${envName}`, { ...stackProps });

// T018-T019: HTTP API Gateway + VPC Link + JWT Authorizer
const apiGatewayStack = new ApiGatewayNlbStack(app, `ApiGatewayStack-${envName}`, {
  ...stackProps,
  vpc: vpcStack.vpc,
  nlb: ecsStack.nlb,
  userPool: cognitoStack.userPool,
  userPoolClient: cognitoStack.userPoolClient,
});
apiGatewayStack.addDependency(vpcStack);
apiGatewayStack.addDependency(ecsStack);
apiGatewayStack.addDependency(cognitoStack);

// ─── Phase 5: Storage & Edge ───────────────────────────────────────────────────

// T020: S3 buckets (independent)
const s3Stack = new S3Stack(app, `S3Stack-${envName}`, { ...stackProps });

// T021-T022: CloudFront distribution with OAC + cache policies (frontend bucket lives here)
const apiGatewayDomain = `${apiGatewayStack.httpApi.apiId}.execute-api.${awsRegion}.amazonaws.com`;
const cloudFrontStack = new CloudFrontStack(app, `CloudFrontStack-${envName}`, {
  ...stackProps,
  apiGatewayDomain,
});
cloudFrontStack.addDependency(apiGatewayStack);

// ─── Phase 6: Observability ────────────────────────────────────────────────────

// T023-T025: CloudWatch Dashboard + Alarms + SNS Alarm Topic
const serviceNames = [
  'member-service',
  'file-service',
  'mail-service',
  'auth-service',
  'master-service',
];

const cloudWatchStack = new CloudWatchStack(app, `CloudWatchStack-${envName}`, {
  ...stackProps,
  cluster: ecsStack.cluster,
  serviceNames,
  mailDlqArn: snsSqsStack.mailServiceQueue.queueArn.replace('aws-micro-demo-mail-queue', 'aws-micro-demo-mail-dlq'),
});
cloudWatchStack.addDependency(ecsStack);
cloudWatchStack.addDependency(snsSqsStack);

app.synth();
