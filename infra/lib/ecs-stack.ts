import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import {
  createAuthServiceIAM,
  createAuthServiceExecutionRole,
  createMemberServiceIAM,
  createMemberServiceExecutionRole,
  createFileServiceIAM,
  createFileServiceExecutionRole,
  createMailServiceIAM,
  createMailServiceExecutionRole,
  createMasterServiceIAM,
  createMasterServiceExecutionRole,
} from './iam';

export interface ServiceDefinition {
  name: string;
  port: number;
}

export interface EcsStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.IVpc;
  ecsSg: ec2.ISecurityGroup;
  nlbSg: ec2.ISecurityGroup;
  repositories: Record<string, ecr.IRepository>;
  dbSecret: secretsmanager.ISecret;
  // RDS connection
  dbHost: string;
  // Cognito
  userPoolArn: string;
  cognitoUserPoolId: string;
  cognitoClientId: string;
  // SNS/SQS
  memberEventsTopicArn: string;
  fileEventsTopicArn: string;
  notificationsTopicArn: string;
  mailQueueArn: string;
  mailQueueUrl: string;
  memberEventQueueUrl: string;
  memberEventQueueArn: string;
  // S3
  storageBucketArn: string;
  storageBucketName: string;
  // Region
  awsRegion: string;
}

const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  { name: 'member-service', port: 8081 },
  { name: 'file-service', port: 8082 },
  { name: 'mail-service', port: 8083 },
  { name: 'auth-service', port: 8084 },
  { name: 'master-service', port: 8085 },
];

export class EcsStack extends cdk.Stack {
  public readonly cluster: ecs.ICluster;
  public readonly nlb: elbv2.INetworkLoadBalancer;
  public readonly services: Record<string, ecs.FargateService>;
  public readonly listenerArns: Record<string, string>;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    const { envName, vpc, ecsSg, nlbSg, repositories, dbSecret,
            dbHost, userPoolArn, cognitoUserPoolId, cognitoClientId,
            memberEventsTopicArn, fileEventsTopicArn, notificationsTopicArn,
            mailQueueArn, mailQueueUrl, memberEventQueueUrl, memberEventQueueArn,
            storageBucketArn, storageBucketName, awsRegion } = props;

    // ─── JWT Secret (managed by CDK, injected as ECS secret) ───────────────────
    const jwtSecret = new secretsmanager.Secret(this, 'JwtSecret', {
      secretName: `/aws-micro-demo/${envName}/jwt-secret`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ secret: 'default-jwt-secret-replace-me' }),
        generateStringKey: 'secret',
        passwordLength: 64,
      },
    });

    // T013: ECS Cluster with Container Insights + Cloud Map namespace
    this.cluster = new ecs.Cluster(this, 'DemoCluster', {
      clusterName: `aws-micro-demo-${envName}`,
      vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    const namespace = new servicediscovery.PrivateDnsNamespace(this, 'ServiceNamespace', {
      name: 'service.local',
      vpc,
      description: 'Cloud Map namespace for aws-micro-demo services',
    });

    // T016: Internal NLB for API Gateway VPC Link
    this.nlb = new elbv2.NetworkLoadBalancer(this, 'DemoNlb', {
      loadBalancerName: `aws-micro-demo-nlb-${envName}`,
      vpc,
      internetFacing: false,
      securityGroups: [nlbSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // ============================================================
    // CREATE EXPLICIT IAM ROLES FOR EACH SERVICE
    // ============================================================

    // Auth Service IAM
    const authTaskRole = createAuthServiceIAM(this, { envName, userPoolArn, dbSecretArn: dbSecret.secretArn });
    const authExecutionRole = createAuthServiceExecutionRole(this, { envName });

    // Member Service IAM
    const memberTaskRole = createMemberServiceIAM(this, {
      envName, memberEventsTopicArn, memberEventQueueArn, dbSecretArn: dbSecret.secretArn,
    });
    const memberExecutionRole = createMemberServiceExecutionRole(this, { envName });

    // File Service IAM
    const fileTaskRole = createFileServiceIAM(this, {
      envName, storageBucketArn, fileEventsTopicArn, dbSecretArn: dbSecret.secretArn,
    });
    const fileExecutionRole = createFileServiceExecutionRole(this, { envName });

    // Mail Service IAM
    const mailTaskRole = createMailServiceIAM(this, { envName, mailQueueArn, notificationsTopicArn });
    const mailExecutionRole = createMailServiceExecutionRole(this, { envName });

    // Master Service IAM
    const masterTaskRole = createMasterServiceIAM(this, { envName, dbSecretArn: dbSecret.secretArn });
    const masterExecutionRole = createMasterServiceExecutionRole(this, { envName });

    // Map service name -> IAM roles
    const taskRoles: Record<string, any> = {
      'auth-service': authTaskRole,
      'member-service': memberTaskRole,
      'file-service': fileTaskRole,
      'mail-service': mailTaskRole,
      'master-service': masterTaskRole,
    };

    const executionRoles: Record<string, any> = {
      'auth-service': authExecutionRole,
      'member-service': memberExecutionRole,
      'file-service': fileExecutionRole,
      'mail-service': mailExecutionRole,
      'master-service': masterExecutionRole,
    };

    // Map service name -> environment variables
    this.listenerArns = {};

    const serviceEnvVars: Record<string, Record<string, string>> = {
      'auth-service': {
        DB_HOST: dbHost,
        DB_NAME: 'auth_db',
        AWS_REGION: awsRegion,
        AWS_COGNITO_USER_POOL_ID: cognitoUserPoolId,
        AWS_COGNITO_CLIENT_ID: cognitoClientId,
      },
      'member-service': {
        DB_HOST: dbHost,
        DB_NAME: 'member_db',
        AWS_REGION: awsRegion,
        AWS_SNS_MEMBER_EVENTS_TOPIC_ARN: memberEventsTopicArn,
        AWS_SQS_AUDIT_QUEUE_URL: memberEventQueueUrl,
      },
      'file-service': {
        DB_HOST: dbHost,
        DB_NAME: 'file_db',
        AWS_REGION: awsRegion,
        AWS_S3_BUCKET_NAME: storageBucketName,
        AWS_SNS_FILE_EVENTS_TOPIC_ARN: fileEventsTopicArn,
      },
      'mail-service': {
        DB_HOST: dbHost,
        DB_NAME: 'mail_db',
        AWS_REGION: awsRegion,
        AWS_SQS_MAIL_QUEUE_URL: mailQueueUrl,
      },
      'master-service': {
        DB_HOST: dbHost,
        DB_NAME: 'master_db',
        AWS_REGION: awsRegion,
        // Inter-service URLs via Cloud Map DNS
        MEMBER_SERVICE_URL: 'http://member-service.service.local:8081',
        FILE_SERVICE_URL: 'http://file-service.service.local:8082',
      },
    };

    // Map service name -> secrets (ECS Secret)
    const serviceSecrets: Record<string, Record<string, ecs.Secret>> = {
      'auth-service': {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
        JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret, 'secret'),
      },
      'member-service': {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
      },
      'file-service': {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
      },
      'mail-service': {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
      },
      'master-service': {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
      },
    };

    this.services = {};

    // T014: Fargate Task Definitions + Services per microservice
    for (const svcDef of SERVICE_DEFINITIONS) {
      const repo = repositories[svcDef.name];
      const svcId = svcDef.name
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');

      const logGroup = new logs.LogGroup(this, `${svcId}LogGroup`, {
        logGroupName: `/ecs/aws-micro-demo/${envName}/${svcDef.name}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // T014: Task Definition — CPU 256, MEM 512
      const taskDef = new ecs.FargateTaskDefinition(this, `${svcId}TaskDef`, {
        family: `aws-micro-demo-${svcDef.name}-${envName}`,
        taskRole: taskRoles[svcDef.name],
        executionRole: executionRoles[svcDef.name],
        cpu: 256,
        memoryLimitMiB: 512,
      });

      taskDef.addContainer(`${svcId}Container`, {
        image: ecs.ContainerImage.fromEcrRepository(repo, 'latest'),
        containerName: svcDef.name,
        portMappings: [{ containerPort: svcDef.port, protocol: ecs.Protocol.TCP }],
        logging: ecs.LogDrivers.awsLogs({
          logGroup,
          streamPrefix: svcDef.name,
        }),
        environment: {
          SPRING_PROFILES_ACTIVE: envName,
          SERVER_PORT: String(svcDef.port),
          ...serviceEnvVars[svcDef.name],
        },
        secrets: {
          ...serviceSecrets[svcDef.name],
        },
      });

      // T013: Fargate Service with Cloud Map service discovery
      const fargateService = new ecs.FargateService(this, `${svcId}Service`, {
        serviceName: `${svcDef.name}-${envName}`,
        cluster: this.cluster,
        taskDefinition: taskDef,
        desiredCount: 1,
        securityGroups: [ecsSg],
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        assignPublicIp: false,
        cloudMapOptions: {
          name: svcDef.name,
          cloudMapNamespace: namespace,
        },
        healthCheckGracePeriod: cdk.Duration.seconds(120),
      });

      this.services[svcDef.name] = fargateService;

      // T016: NLB listener + target group per service port
      const nlbTargetGroup = new elbv2.NetworkTargetGroup(this, `${svcId}NlbTg`, {
        targetGroupName: `${svcDef.name.substring(0, 22)}-nlb-tg`,
        vpc,
        port: svcDef.port,
        protocol: elbv2.Protocol.TCP,
        targets: [fargateService.loadBalancerTarget({
          containerName: svcDef.name,
          containerPort: svcDef.port,
        })],
        healthCheck: {
          port: String(svcDef.port),
          interval: cdk.Duration.seconds(60),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      });

      // NLB listener — target group will be registered by ApiGatewayNlbStack
      const listener = this.nlb.addListener(`${svcId}NlbListener`, {
        port: svcDef.port,
        protocol: elbv2.Protocol.TCP,
        defaultAction: elbv2.NetworkListenerAction.forward([nlbTargetGroup]),
      });
      this.listenerArns[svcDef.port] = listener.listenerArn;
    }

    // Outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      exportName: `${envName}-ClusterName`,
    });
    new cdk.CfnOutput(this, 'NlbDnsName', {
      value: this.nlb.loadBalancerDnsName,
      description: 'Internal NLB DNS Name',
      exportName: `${envName}-NlbDnsName`,
    });
    new cdk.CfnOutput(this, 'NlbArn', {
      value: this.nlb.loadBalancerArn,
      description: 'Internal NLB ARN for VPC Link',
      exportName: `${envName}-NlbArn`,
    });

    // Export listener ARNs for ApiGatewayStack
    for (const [port, arn] of Object.entries(this.listenerArns)) {
      new cdk.CfnOutput(this, `NlbListener${port}Arn`, {
        value: arn,
        description: `NLB listener ARN for port ${port}`,
        exportName: `${envName}-NlbListener${port}Arn`,
      });
    }
  }
}
