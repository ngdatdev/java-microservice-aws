import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface MailServiceIAMProps {
  envName: string;
  mailQueueArn: string;
  notificationsTopicArn: string;
}

/**
 * Mail Service IAM Role + Policy
 * Permissions: SQS Receive (mail queue) + SES Send (email) + SNS (notifications)
 */
export function createMailServiceIAM(scope: Construct, props: MailServiceIAMProps): iam.Role {
  const { envName, mailQueueArn, notificationsTopicArn } = props;

  const taskRole = new iam.Role(scope, 'MailServiceTaskRole', {
    roleName: `mail-service-task-role-${envName}`,
    description: 'Task role for mail-service ECS task',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });

  // Policy: SQS Mail Queue — nhận email tasks từ queue
  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SQSMailQueue',
      effect: iam.Effect.ALLOW,
      actions: [
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage',
        'sqs:GetQueueUrl',
        'sqs:GetQueueAttributes',
        'sqs:ListQueues',
      ],
      resources: [mailQueueArn],
    })
  );

  // Policy: SES Send Email — gửi email thật
  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SESSendEmail',
      effect: iam.Effect.ALLOW,
      actions: [
        'ses:SendEmail',
        'ses:SendRawEmail',
        'ses:SendTemplatedEmail',
        'ses:DescribeEmailIdentity',
        'ses:ListIdentities',
      ],
      resources: ['*'],  // SES Identity ARN cụ thể sẽ được set qua env
    })
  );

  // Policy: SNS Notifications — publish notifications
  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SNSNotifications',
      effect: iam.Effect.ALLOW,
      actions: [
        'sns:Publish',
        'sns:GetTopicAttributes',
      ],
      resources: [notificationsTopicArn],
    })
  );

  return taskRole;
}

/**
 * Mail Service Execution Role (pull image + write logs)
 */
export function createMailServiceExecutionRole(scope: Construct, props: MailServiceIAMProps): iam.Role {
  const { envName } = props;

  const executionRole = new iam.Role(scope, 'MailServiceExecutionRole', {
    roleName: `mail-service-execution-role-${envName}`,
    description: 'Execution role for mail-service ECS task (pull image, logs)',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
    ],
  });

  return executionRole;
}