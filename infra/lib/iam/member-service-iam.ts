import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface MemberServiceIAMProps {
  envName: string;
  memberEventsTopicArn: string;
  auditQueueArn: string;
  dbSecretArn: string;
}

/**
 * Member Service IAM Role + Policy
 * Permissions: SNS Publish (member events) + SQS Send (audit) + Secrets Manager
 */
export function createMemberServiceIAM(scope: Construct, props: MemberServiceIAMProps): iam.Role {
  const { envName, memberEventsTopicArn, auditQueueArn, dbSecretArn } = props;

  const taskRole = new iam.Role(scope, 'MemberServiceTaskRole', {
    roleName: `member-service-task-role-${envName}`,
    description: 'Task role for member-service ECS task',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });

  // Policy: SNS Publish — chỉ topic member-events
  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SNSPublish',
      effect: iam.Effect.ALLOW,
      actions: [
        'sns:Publish',
        'sns:CreateTopic',
        'sns:GetTopicAttributes',
      ],
      resources: [memberEventsTopicArn],
    })
  );

  // Policy: SQS Audit Queue — gửi audit events
  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SQSAudit',
      effect: iam.Effect.ALLOW,
      actions: [
        'sqs:SendMessage',
        'sqs:SendMessageBatch',
        'sqs:GetQueueUrl',
        'sqs:GetQueueAttributes',
      ],
      resources: [auditQueueArn],
    })
  );

  // Policy: Secrets Manager — chỉ đọc DB credentials
  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SecretsManagerRead',
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret',
      ],
      resources: [dbSecretArn],
    })
  );

  return taskRole;
}

/**
 * Member Service Execution Role (pull image + write logs)
 */
export function createMemberServiceExecutionRole(scope: Construct, props: MemberServiceIAMProps): iam.Role {
  const { envName } = props;

  const executionRole = new iam.Role(scope, 'MemberServiceExecutionRole', {
    roleName: `member-service-execution-role-${envName}`,
    description: 'Execution role for member-service ECS task (pull image, logs)',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
    ],
  });

  return executionRole;
}