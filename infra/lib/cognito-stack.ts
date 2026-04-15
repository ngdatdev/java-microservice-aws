import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface CognitoStackProps extends cdk.StackProps {
  envName: string;
}

export class CognitoStack extends cdk.Stack {
  public readonly userPool: cognito.IUserPool;
  public readonly userPoolArn: string;
  public readonly userPoolClient: cognito.IUserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const { envName } = props;

    // T017: User Pool
    this.userPool = new cognito.UserPool(this, 'DemoUserPool', {
      userPoolName: `aws-micro-demo-user-pool-${envName}`,
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
      },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // T017: User Pool Client
    this.userPoolClient = (this.userPool as cognito.UserPool).addClient('DemoAppClient', {
      userPoolClientName: `aws-micro-demo-app-client-${envName}`,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    this.userPoolArn = this.userPool.userPoolArn;

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: (this.userPool as cognito.UserPool).userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${envName}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `${envName}-UserPoolClientId`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `${envName}-UserPoolArn`,
    });
  }
}
