import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface VpcStackProps extends cdk.StackProps {
  envName: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly albSg: ec2.ISecurityGroup;
  public readonly ecsSg: ec2.ISecurityGroup;
  public readonly rdsSg: ec2.ISecurityGroup;
  public readonly nlbSg: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    // VPC
    this.vpc = new ec2.Vpc(this, 'DemoVpc', {
      vpcName: `aws-micro-demo-vpc-${props.envName}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 1, // Cost saving for demo
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Security Groups
    // 1. ALB Security Group
    this.albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc: this.vpc,
      securityGroupName: `aws-micro-demo-alb-sg-${props.envName}`,
      description: 'Security group for the Application Load Balancer',
      allowAllOutbound: true,
    });
    this.albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
    this.albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic');

    // 2. ECS Tasks Security Group
    this.ecsSg = new ec2.SecurityGroup(this, 'EcsSg', {
      vpc: this.vpc,
      securityGroupName: `aws-micro-demo-ecs-sg-${props.envName}`,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true, // Need outbound for pulling images, reaching AWS APIs if no endpoints
    });
    // Allow traffic from ALB on service ports
    for (const port of [8081, 8082, 8083, 8084, 8085]) {
      this.ecsSg.addIngressRule(this.albSg, ec2.Port.tcp(port), `Allow traffic from ALB on port ${port}`);
    }

    // 3. RDS Security Group
    this.rdsSg = new ec2.SecurityGroup(this, 'RdsSg', {
      vpc: this.vpc,
      securityGroupName: `aws-micro-demo-rds-sg-${props.envName}`,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: true,
    });
    this.rdsSg.addIngressRule(this.ecsSg, ec2.Port.tcp(5432), 'Allow PostgreSQL traffic from ECS tasks');

    // 4. NLB Security Group
    this.nlbSg = new ec2.SecurityGroup(this, 'NlbSg', {
      vpc: this.vpc,
      securityGroupName: `aws-micro-demo-nlb-sg-${props.envName}`,
      description: 'Security group for Network Load Balancer',
      allowAllOutbound: true,
    });
    // The NLB will receive traffic from API Gateway VPC Link. 
    this.nlbSg.addIngressRule(ec2.Peer.ipv4(this.vpc.vpcCidrBlock), ec2.Port.allTcp(), 'Allow TCP traffic from within VPC (for API GW VPC Link)');
    
    // Also allow NLB to talk to ECS Tasks
    for (const port of [8081, 8082, 8083, 8084, 8085]) {
      this.ecsSg.addIngressRule(this.nlbSg, ec2.Port.tcp(port), `Allow traffic from NLB on port ${port}`);
    }

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'The ID of the VPC',
    });
    
    new cdk.CfnOutput(this, 'AlbSgId', {
      value: this.albSg.securityGroupId,
    });
    
    new cdk.CfnOutput(this, 'EcsSgId', {
      value: this.ecsSg.securityGroupId,
    });

    new cdk.CfnOutput(this, 'RdsSgId', {
      value: this.rdsSg.securityGroupId,
    });
    
    new cdk.CfnOutput(this, 'NlbSgId', {
      value: this.nlbSg.securityGroupId,
    });
  }
}
