import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface FileServiceIAMProps {
  envName: string;
  storageBucketArn: string;
  fileEventsTopicArn: string;
  dbSecretArn: string;
}

export interface FileServiceExecutionRoleProps {
  envName: string;
}

/**
 * File Service Task Role — Permissions: S3 (upload/download/delete) + SNS Publish (file events) + Secrets Manager
 */
export function createFileServiceIAM(scope: Construct, props: FileServiceIAMProps): iam.Role {
  const { envName, storageBucketArn, fileEventsTopicArn, dbSecretArn } = props;

  const taskRole = new iam.Role(scope, 'FileServiceTaskRole', {
    roleName: `file-service-task-role-${envName}`,
    description: 'Task role for file-service ECS task',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'S3Storage',
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:GetObject',
        's3:DeleteObject',
        's3:ListBucket',
        's3:GetBucketLocation',
        's3:AbortMultipartUpload',
        's3:ListMultipartUploadParts',
      ],
      resources: [storageBucketArn, `${storageBucketArn}/*`],
    })
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SNSPublish',
      effect: iam.Effect.ALLOW,
      actions: ['sns:Publish', 'sns:CreateTopic', 'sns:GetTopicAttributes'],
      resources: [fileEventsTopicArn],
    })
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SecretsManagerRead',
      effect: iam.Effect.ALLOW,
      actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
      resources: [dbSecretArn],
    })
  );

  return taskRole;
}

/**
 * File Service Execution Role — Permissions: pull image + write logs + read secrets
 */
export function createFileServiceExecutionRole(scope: Construct, props: FileServiceExecutionRoleProps): iam.Role {
  const { envName } = props;

  const executionRole = new iam.Role(scope, 'FileServiceExecutionRole', {
    roleName: `file-service-execution-role-${envName}`,
    description: 'Execution role for file-service ECS task (pull image, logs, secrets)',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
    ],
  });

  executionRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SecretsManagerReadForInjection',
      effect: iam.Effect.ALLOW,
      actions: ['secretsmanager:GetSecretValue'],
      resources: ['*'], // Restrict to specific secret ARN in production
    })
  );

  return executionRole;
}
