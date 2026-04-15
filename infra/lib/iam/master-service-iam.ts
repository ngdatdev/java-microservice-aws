import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface MasterServiceIAMProps {
  envName: string;
  dbSecretArn: string;
}

/**
 * Master Service IAM Role + Policy
 * Permissions: Internal orchestration — gọi member-service, file-service, auth-service
 *              Chỉ cần DB credentials để đọc dữ liệu tổng hợp
 */
export function createMasterServiceIAM(scope: Construct, props: MasterServiceIAMProps): iam.Role {
  const { envName, dbSecretArn } = props;

  const taskRole = new iam.Role(scope, 'MasterServiceTaskRole', {
    roleName: `master-service-task-role-${envName}`,
    description: 'Task role for master-service ECS task (orchestrator)',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });

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

  // Policy: Internal HTTP calls — master-service gọi các service khác qua ALB
  // Quyền này cho phép master-service gọi internal endpoints
  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'InternalServiceCalls',
      effect: iam.Effect.ALLOW,
      actions: [
        'execute-api:Invoke',
        'execute-api:ManageConnections',
      ],
      resources: [
        `arn:aws:execute-api:*:*:api/*/*/*`,
        `arn:aws:execute-api:*:*:vpclink/*`,
      ],
    })
  );

  return taskRole;
}

/**
 * Master Service Execution Role (pull image + write logs)
 */
export function createMasterServiceExecutionRole(scope: Construct, props: MasterServiceIAMProps): iam.Role {
  const { envName } = props;

  const executionRole = new iam.Role(scope, 'MasterServiceExecutionRole', {
    roleName: `master-service-execution-role-${envName}`,
    description: 'Execution role for master-service ECS task (pull image, logs)',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
    ],
  });

  return executionRole;
}