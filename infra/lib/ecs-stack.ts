import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface ServiceDefinition {
  name: string;
  port: number;
  repositoryUri: string;
}

export interface EcsStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.IVpc;
  albSg: ec2.ISecurityGroup;
  ecsSg: ec2.ISecurityGroup;
  nlbSg: ec2.ISecurityGroup;
  repositories: Record<string, ecr.IRepository>;
  dbSecret: secretsmanager.ISecret;
}

const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  { name: 'member-service', port: 8081, repositoryUri: '' },
  { name: 'file-service', port: 8082, repositoryUri: '' },
  { name: 'mail-service', port: 8083, repositoryUri: '' },
  { name: 'auth-service', port: 8084, repositoryUri: '' },
  { name: 'master-service', port: 8085, repositoryUri: '' },
];

export class EcsStack extends cdk.Stack {
  public readonly cluster: ecs.ICluster;
  public readonly nlb: elbv2.INetworkLoadBalancer;
  public readonly alb: elbv2.IApplicationLoadBalancer;
  public readonly services: Record<string, ecs.FargateService>;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    const { envName, vpc, albSg, ecsSg, nlbSg, repositories, dbSecret } = props;

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

    // T015: Application Load Balancer with path-based routing
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'DemoAlb', {
      loadBalancerName: `aws-micro-demo-alb-${envName}`,
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const httpListener = this.alb.addListener('HttpListener', {
      port: 80,
      open: false,
    });

    // T016: Internal NLB for VPC Link
    this.nlb = new elbv2.NetworkLoadBalancer(this, 'DemoNlb', {
      loadBalancerName: `aws-micro-demo-nlb-${envName}`,
      vpc,
      internetFacing: false,
      securityGroups: [nlbSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

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
        cpu: 256,
        memoryLimitMiB: 512,
      });

      // Grant access to RDS secret
      dbSecret.grantRead(taskDef.taskRole);

      const container = taskDef.addContainer(`${svcId}Container`, {
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
        },
        secrets: {
          DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
          DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
        },
      });
      container.addPortMappings({ containerPort: svcDef.port });

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
      });

      this.services[svcDef.name] = fargateService;

      // T015: ALB path-based target group
      const albTargetGroup = new elbv2.ApplicationTargetGroup(this, `${svcId}AlbTg`, {
        targetGroupName: `${svcDef.name.substring(0, 22)}-alb-tg`,
        vpc,
        port: svcDef.port,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [fargateService],
        healthCheck: {
          path: `/api/v1/${svcDef.name.replace('-service', 's')}/health`,
          interval: cdk.Duration.seconds(30),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      });

      // Register path rule on ALB listener
      const pathPrefix = svcDef.name.replace('-service', 's');
      httpListener.addTargetGroups(`${svcId}AlbRule`, {
        priority: SERVICE_DEFINITIONS.indexOf(svcDef) + 1,
        conditions: [
          elbv2.ListenerCondition.pathPatterns([`/api/v1/${pathPrefix}/*`]),
        ],
        targetGroups: [albTargetGroup],
      });

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
          interval: cdk.Duration.seconds(30),
        },
      });

      this.nlb.addListener(`${svcId}NlbListener`, {
        port: svcDef.port,
        protocol: elbv2.Protocol.TCP,
        defaultTargetGroups: [nlbTargetGroup],
      });
    }

    // Default ALB action: 404
    httpListener.addAction('DefaultAction', {
      action: elbv2.ListenerAction.fixedResponse(404, {
        messageBody: 'Not found',
      }),
    });

    // Outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      exportName: `${envName}-ClusterName`,
    });
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      description: 'ALB DNS Name',
      exportName: `${envName}-AlbDnsName`,
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
  }
}
