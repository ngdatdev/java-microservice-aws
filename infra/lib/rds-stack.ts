import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface RdsStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.IVpc;
  ecsSg: ec2.ISecurityGroup;
  rdsSg: ec2.ISecurityGroup;
}

export class RdsStack extends cdk.Stack {
  public readonly dbInstance: rds.IDatabaseInstance;
  public readonly dbSecret: secretsmanager.ISecret;
  public readonly dbEndpointAddress: string;
  public readonly dbPort: string;
  public readonly dbName: string;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    const { envName, vpc, rdsSg } = props;

    // T011: Credentials managed via AWS Secrets Manager
    this.dbSecret = new secretsmanager.Secret(this, 'RdsCredentials', {
      secretName: `/aws-micro-demo/${envName}/rds-credentials`,
      description: 'RDS PostgreSQL credentials for aws-micro-demo',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'adminuser' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // T010: RDS PostgreSQL instance
    this.dbInstance = new rds.DatabaseInstance(this, 'DemoRds', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_7,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [rdsSg],
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      databaseName: 'awsmicrodemo',
      backupRetention: cdk.Duration.days(1),
      storageEncrypted: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      multiAz: false,
      allocatedStorage: 20,
      instanceIdentifier: `aws-micro-demo-db-${envName}`,
    });

    this.dbEndpointAddress = this.dbInstance.dbInstanceEndpointAddress;
    this.dbPort = this.dbInstance.dbInstanceEndpointPort;
    this.dbName = 'awsmicrodemo';

    // Outputs
    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: this.dbInstance.dbInstanceEndpointAddress,
      description: 'RDS instance endpoint address',
      exportName: `${envName}-RdsEndpoint`,
    });

    new cdk.CfnOutput(this, 'RdsPort', {
      value: this.dbInstance.dbInstanceEndpointPort,
      description: 'RDS instance port',
      exportName: `${envName}-RdsPort`,
    });

    new cdk.CfnOutput(this, 'RdsSecretArn', {
      value: this.dbSecret.secretArn,
      description: 'ARN of the RDS credentials secret',
      exportName: `${envName}-RdsSecretArn`,
    });
  }
}
