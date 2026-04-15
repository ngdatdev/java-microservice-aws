import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface AuthServiceIAMProps {
  envName: string;
  userPoolArn: string;
  dbSecretArn: string;
}

/**
 * Auth Service IAM Role + Policy
 * Permissions: Cognito (admin auth) + Secrets Manager (DB credentials)
 */
export function createAuthServiceIAM(scope: Construct, props: AuthServiceIAMProps): iam.Role {
  const { envName, userPoolArn, dbSecretArn } = props;

  const taskRole = new iam.Role(scope, 'AuthServiceTaskRole', {
    roleName: `auth-service-task-role-${envName}`,
    description: 'Task role for auth-service ECS task',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });

  // Policy: Cognito
  taskRole.addToPolicy(
    new iam.PolicyStatement({
      sid: 'CognitoAuth',
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminInitiateAuth',
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminConfirmSignUp',
        'cognito-idp:GlobalSignOut',
        'cognito-idp:ListUsers',
        'cognito-idp:SignUp',
        'cognito-idp:ConfirmSignUp',
        'cognito-idp:InitiateAuth',
        'cognito-idp:RespondToAuthChallenge',
        'cognito-idp:GetUser',
        'cognito-idp:GetUserAttributeVerificationCode',
        'cognito-idp:VerifyUserAttribute',
      ],
      resources: [userPoolArn],
    })
  );

  // Policy: Secrets Manager
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
 * Auth Service Execution Role (pull image + write logs)
 */
export function createAuthServiceExecutionRole(scope: Construct, props: AuthServiceIAMProps): iam.Role {
  const { envName } = props;

  const executionRole = new iam.Role(scope, 'AuthServiceExecutionRole', {
    roleName: `auth-service-execution-role-${envName}`,
    description: 'Execution role for auth-service ECS task (pull image, logs)',
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
    ],
  });

  return executionRole;
}