import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface MasterServiceIAMProps {
  envName: string;
  dbSecretArn: string;
}

export interface MasterServiceExecutionRoleProps {
  envName: string;
}

/**
 * Master Service Task Role — Permissions: Secrets Manager (DB credentials) + API Gateway (internal calls)
 */
export function createMasterServiceIAM(scope: Construct, props: MasterServiceIAMProps): iam.Role {
  const { envName, dbSecretArn } = props;

  const taskRole = new iam.Role(scope, 'MasterServiceTaskRole', {
    roleName: `master-service-task-role-${envName}`,
    description: 'Task role for master-service ECS task (orchestrator)',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'SecretsManagerRead',
      effect: iam.Effect.ALLOW,
      actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
      resources: [dbSecretArn],
    })
  );

  // Allow internal service calls via API Gateway
  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'InternalServiceCalls',
      effect: iam.Effect.ALLOW,
      actions: ['execute-api:Invoke', 'execute-api:ManageConnections'],
      resources: [
        'arn:aws:execute-api:*:*:api/*/*/*',
        'arn:aws:execute-api:*:*:vpclink/*',
      ],
    })
  );

  return taskRole;
}

/**
 * Master Service Execution Role — Permissions: pull image + write logs + read secrets
 */
export function createMasterServiceExecutionRole(scope: Construct, props: MasterServiceExecutionRoleProps): iam.Role {
  const { envName } = props;

  const executionRole = new iam.Role(scope, 'MasterServiceExecutionRole', {
    roleName: `master-service-execution-role-${envName}`,
    description: 'Execution role for master-service ECS task (pull image, logs, secrets)',
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
