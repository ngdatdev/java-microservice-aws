import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export interface EcrStackProps extends cdk.StackProps {
  envName: string;
}

export class EcrStack extends cdk.Stack {
  public readonly repositories: Record<string, ecr.IRepository>;

  constructor(scope: Construct, id: string, props: EcrStackProps) {
    super(scope, id, props);

    const services = [
      'member-service',
      'file-service',
      'mail-service',
      'auth-service',
      'master-service',
    ];

    this.repositories = {};

    for (const serviceName of services) {
      const repoId = serviceName
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('') + 'Repo';

      const repo = new ecr.Repository(this, repoId, {
        repositoryName: `aws-micro-demo/${serviceName}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        emptyOnDelete: true,
        lifecycleRules: [
          {
            description: 'Keep last 10 images',
            maxImageCount: 10,
          },
        ],
      });

      this.repositories[serviceName] = repo;

      new cdk.CfnOutput(this, `${repoId}Uri`, {
        value: repo.repositoryUri,
        description: `ECR repository URI for ${serviceName}`,
        exportName: `${props.envName}-${repoId}Uri`,
      });
    }
  }
}
