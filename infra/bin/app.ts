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

const envName = app.node.tryGetContext('env') ?? 'dev';
const awsAccount = process.env.CDK_DEPLOY_ACCOUNT ?? process.env.CDK_DEFAULT_ACCOUNT ?? '000000000000';
const awsRegion = process.env.CDK_DEPLOY_REGION ?? process.env.CDK_DEFAULT_REGION ?? 'ap-southeast-1';

const env: cdk.Environment = { account: awsAccount, region: awsRegion };
const stackProps = { env, envName };

cdk.Tags.of(app).add('Project', 'aws-micro-demo');
cdk.Tags.of(app).add('Environment', envName);
cdk.Tags.of(app).add('ManagedBy', 'CDK');

// ─── Phase 1: Foundation ───────────────────────────────────────────────────────

const vpcStack = new VpcStack(app, `VpcStack-${envName}`, { ...stackProps });

const snsSqsStack = new SnsSqsStack(app, `SnsSqsStack-${envName}`, { ...stackProps });

const ecrStack = new EcrStack(app, `EcrStack-${envName}`, { ...stackProps });

// ─── Phase 2: Persistence ──────────────────────────────────────────────────────

const rdsStack = new RdsStack(app, `RdsStack-${envName}`, {
  ...stackProps,
  vpc: vpcStack.vpc,
  ecsSg: vpcStack.ecsSg,
  rdsSg: vpcStack.rdsSg,
});
rdsStack.addDependency(vpcStack);

// ─── Phase 3: Auth & S3 — tạo TRƯỚC ECS (vì ECS cần ARN của chúng) ───────────

const cognitoStack = new CognitoStack(app, `CognitoStack-${envName}`, { ...stackProps });

const s3Stack = new S3Stack(app, `S3Stack-${envName}`, { ...stackProps });

// ─── Phase 4: ECS Cluster — cần ARN từ Cognito + S3 ─────────────────────────

const ecsStack = new EcsStack(app, `EcsStack-${envName}`, {
  ...stackProps,
  vpc: vpcStack.vpc,
  ecsSg: vpcStack.ecsSg,
  nlbSg: vpcStack.nlbSg,
  repositories: ecrStack.repositories,
  dbSecret: rdsStack.dbSecret,
  dbHost: rdsStack.dbInstance.dbInstanceEndpointAddress,
  // ARN inputs for IAM + environment variables
  userPoolArn: cognitoStack.userPool.userPoolArn,
  cognitoUserPoolId: (cognitoStack.userPool as any).userPoolId,
  cognitoClientId: cognitoStack.userPoolClient.userPoolClientId,
  memberEventsTopicArn: snsSqsStack.memberEventsTopic.topicArn,
  fileEventsTopicArn: snsSqsStack.fileEventsTopic.topicArn,
  notificationsTopicArn: snsSqsStack.notificationsTopic.topicArn,
  mailQueueArn: snsSqsStack.mailServiceQueue.queueArn,
  mailQueueUrl: snsSqsStack.mailServiceQueue.queueUrl,
  auditQueueArn: snsSqsStack.memberEventQueue.queueArn,
  storageBucketArn: s3Stack.storageBucket.bucketArn,
  storageBucketName: s3Stack.storageBucket.bucketName,
  awsRegion: awsRegion,
});
ecsStack.addDependency(vpcStack);
ecsStack.addDependency(ecrStack);
ecsStack.addDependency(rdsStack);
ecsStack.addDependency(snsSqsStack);
ecsStack.addDependency(cognitoStack);
ecsStack.addDependency(s3Stack);

// ─── Phase 5: API Gateway ─────────────────────────────────────────────────────

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

// ─── Phase 6: CloudFront ───────────────────────────────────────────────────────

const apiGatewayDomain = `${apiGatewayStack.httpApi.apiId}.execute-api.${awsRegion}.amazonaws.com`;
const cloudFrontStack = new CloudFrontStack(app, `CloudFrontStack-${envName}`, {
  ...stackProps,
  apiGatewayDomain,
});
cloudFrontStack.addDependency(apiGatewayStack);

// ─── Phase 7: Observability ───────────────────────────────────────────────────

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