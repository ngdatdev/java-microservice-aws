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
      const repoName = `aws-micro-demo/${serviceName}`;
      let repo: ecr.IRepository;

      try {
        // Try to import existing repo
        repo = ecr.Repository.fromRepositoryName(this, `Import${serviceName}`, repoName);
      } catch {
        // Repo doesn't exist → create new one
        repo = new ecr.Repository(this, `Create${serviceName}`, {
          repositoryName: repoName,
          removalPolicy: cdk.RemovalPolicy.RETAIN,
          lifecycleRules: [
            {
              description: 'Keep last 10 images',
              maxImageCount: 10,
            },
          ],
        });
      }

      this.repositories[serviceName] = repo;

      const repoId = serviceName
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('') + 'Repo';

      new cdk.CfnOutput(this, `${repoId}Uri`, {
        value: repo.repositoryUri,
        description: `ECR repository URI for ${serviceName}`,
        exportName: `${props.envName}-${repoId}Uri`,
      });
    }
  }
}