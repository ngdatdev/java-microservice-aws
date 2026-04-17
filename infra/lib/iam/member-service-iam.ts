import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface MemberServiceIAMProps {
  envName: string;
  memberEventsTopicArn: string;
  memberEventQueueArn: string;
  dbSecretArn: string;
}

export interface MemberServiceExecutionRoleProps {
  envName: string;
}

/**
 * Member Service Task Role — Permissions: SNS Publish (member events) + SQS Send (audit) + Secrets Manager
 */
export function createMemberServiceIAM(scope: Construct, props: MemberServiceIAMProps): iam.Role {
  const { envName, memberEventsTopicArn, memberEventQueueArn, dbSecretArn } = props;

  const taskRole = new iam.Role(scope, 'MemberServiceTaskRole', {
    roleName: `member-service-task-role-${envName}`,
    description: 'Task role for member-service ECS task',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SNSPublish',
      effect: iam.Effect.ALLOW,
      actions: ['sns:Publish', 'sns:CreateTopic', 'sns:GetTopicAttributes'],
      resources: [memberEventsTopicArn],
    })
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SQSAudit',
      effect: iam.Effect.ALLOW,
      actions: ['sqs:SendMessage', 'sqs:SendMessageBatch', 'sqs:GetQueueUrl', 'sqs:GetQueueAttributes'],
      resources: [memberEventQueueArn],
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
 * Member Service Execution Role — Permissions: pull image + write logs + read secrets
 */
export function createMemberServiceExecutionRole(scope: Construct, props: MemberServiceExecutionRoleProps): iam.Role {
  const { envName } = props;

  const executionRole = new iam.Role(scope, 'MemberServiceExecutionRole', {
    roleName: `member-service-execution-role-${envName}`,
    description: 'Execution role for member-service ECS task (pull image, logs, secrets)',
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
