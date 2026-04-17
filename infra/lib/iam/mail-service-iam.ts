import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface MailServiceIAMProps {
  envName: string;
  mailQueueArn: string;
  notificationsTopicArn: string;
}

export interface MailServiceExecutionRoleProps {
  envName: string;
}

/**
 * Mail Service Task Role — Permissions: SQS (mail queue) + SNS (notifications)
 */
export function createMailServiceIAM(scope: Construct, props: MailServiceIAMProps): iam.Role {
  const { envName, mailQueueArn, notificationsTopicArn } = props;

  const taskRole = new iam.Role(scope, 'MailServiceTaskRole', {
    roleName: `mail-service-task-role-${envName}`,
    description: 'Task role for mail-service ECS task',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SQSMailQueue',
      effect: iam.Effect.ALLOW,
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueUrl', 'sqs:GetQueueAttributes', 'sqs:ListQueues'],
      resources: [mailQueueArn],
    })
  );

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SNSNotifications',
      effect: iam.Effect.ALLOW,
      actions: ['sns:Publish', 'sns:GetTopicAttributes'],
      resources: [notificationsTopicArn],
    })
  );

  return taskRole;
}

/**
 * Mail Service Execution Role — Permissions: pull image + write logs + read secrets
 */
export function createMailServiceExecutionRole(scope: Construct, props: MailServiceExecutionRoleProps): iam.Role {
  const { envName } = props;

  const executionRole = new iam.Role(scope, 'MailServiceExecutionRole', {
    roleName: `mail-service-execution-role-${envName}`,
    description: 'Execution role for mail-service ECS task (pull image, logs, secrets)',
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
