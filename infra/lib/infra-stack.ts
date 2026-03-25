import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. SNS Topics
    const memberEventsTopic = new sns.Topic(this, 'MemberEventsTopic', {
      topicName: 'member-events',
    });

    const fileEventsTopic = new sns.Topic(this, 'FileEventsTopic', {
      topicName: 'file-events',
    });

    // 2. SQS Queues
    const mailQueue = new sqs.Queue(this, 'MailQueue', {
      queueName: 'mail-queue',
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // 3. SNS -> SQS Subscription
    memberEventsTopic.addSubscription(new subs.SqsSubscription(mailQueue));

    // 4. S3 Bucket
    const fileStorageBucket = new s3.Bucket(this, 'FileStorageBucket', {
      bucketName: 'demo-file-storage',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // NOTE: Cognito User Pool is not supported in LocalStack Community Edition.
    // For local development, the Auth Service uses direct config via application.yml.
    // When deploying to real AWS, uncomment the Cognito section below.
    /*
    import * as cognito from 'aws-cdk-lib/aws-cognito';

    const userPool = new cognito.UserPool(this, 'DemoUserPool', {
      userPoolName: 'demo-user-pool',
      selfSignUpEnabled: true,
      signInAliases: { username: true, email: true },
      autoVerify: { email: true },
    });

    const userPoolClient = userPool.addClient('DemoAppClient', {
      userPoolClientName: 'demo-app-client',
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userPassword: true,
      },
    });
    */

    // Outputs
    new cdk.CfnOutput(this, 'MemberEventsTopicArn', { value: memberEventsTopic.topicArn });
    new cdk.CfnOutput(this, 'FileEventsTopicArn', { value: fileEventsTopic.topicArn });
    new cdk.CfnOutput(this, 'MailQueueUrl', { value: mailQueue.queueUrl });
    new cdk.CfnOutput(this, 'FileStorageBucketName', { value: fileStorageBucket.bucketName });
  }
}
