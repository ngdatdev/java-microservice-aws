import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

export interface SnsSqsStackProps extends cdk.StackProps {
  envName: string;
}

export class SnsSqsStack extends cdk.Stack {
  public readonly memberEventsTopic: sns.ITopic;
  public readonly fileEventsTopic: sns.ITopic;
  public readonly notificationsTopic: sns.ITopic;
  public readonly mailServiceQueue: sqs.IQueue;
  public readonly fileProcessingQueue: sqs.IQueue;
  public readonly memberEventQueue: sqs.IQueue;

  constructor(scope: Construct, id: string, props: SnsSqsStackProps) {
    super(scope, id, props);

    const env = props.envName;

    // Dead Letter Queues
    const mailDlq = new sqs.Queue(this, 'MailServiceDlq', {
      queueName: `aws-micro-demo-mail-dlq-${env}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const fileProcessingDlq = new sqs.Queue(this, 'FileProcessingDlq', {
      queueName: `aws-micro-demo-file-processing-dlq-${env}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const memberEventDlq = new sqs.Queue(this, 'MemberEventDlq', {
      queueName: `aws-micro-demo-member-event-dlq-${env}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Main Queues
    this.mailServiceQueue = new sqs.Queue(this, 'MailServiceQueue', {
      queueName: `aws-micro-demo-mail-queue-${env}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: { queue: mailDlq, maxReceiveCount: 3 },
    });

    this.fileProcessingQueue = new sqs.Queue(this, 'FileProcessingQueue', {
      queueName: `aws-micro-demo-file-processing-queue-${env}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: { queue: fileProcessingDlq, maxReceiveCount: 3 },
    });

    this.memberEventQueue = new sqs.Queue(this, 'MemberEventQueue', {
      queueName: `aws-micro-demo-member-event-queue-${env}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: { queue: memberEventDlq, maxReceiveCount: 3 },
    });

    // SNS Topics
    this.memberEventsTopic = new sns.Topic(this, 'MemberEventsTopic', {
      topicName: `aws-micro-demo-member-events-${env}`,
      displayName: 'Member Events Topic',
    });

    this.fileEventsTopic = new sns.Topic(this, 'FileEventsTopic', {
      topicName: `aws-micro-demo-file-events-${env}`,
      displayName: 'File Events Topic',
    });

    this.notificationsTopic = new sns.Topic(this, 'NotificationsTopic', {
      topicName: `aws-micro-demo-notifications-${env}`,
      displayName: 'Notifications Topic',
    });

    // Subscriptions: MemberEvents (MEMBER_CREATED) -> MailServiceQueue
    this.memberEventsTopic.addSubscription(
      new subs.SqsSubscription(this.mailServiceQueue as sqs.Queue, {
        filterPolicy: {
          eventType: sns.SubscriptionFilter.stringFilter({
            allowlist: ['MEMBER_CREATED'],
          }),
        },
      }),
    );

    // Subscriptions: FileEvents (FILE_UPLOADED) -> MailServiceQueue
    this.fileEventsTopic.addSubscription(
      new subs.SqsSubscription(this.mailServiceQueue as sqs.Queue, {
        filterPolicy: {
          eventType: sns.SubscriptionFilter.stringFilter({
            allowlist: ['FILE_UPLOADED'],
          }),
        },
      }),
    );

    // MemberEvents -> MemberEventQueue (all events)
    this.memberEventsTopic.addSubscription(
      new subs.SqsSubscription(this.memberEventQueue as sqs.Queue),
    );

    // FileEvents -> FileProcessingQueue (all events)
    this.fileEventsTopic.addSubscription(
      new subs.SqsSubscription(this.fileProcessingQueue as sqs.Queue),
    );

    // Outputs
    new cdk.CfnOutput(this, 'MemberEventsTopicArn', {
      value: this.memberEventsTopic.topicArn,
      exportName: `${env}-MemberEventsTopicArn`,
    });
    new cdk.CfnOutput(this, 'FileEventsTopicArn', {
      value: this.fileEventsTopic.topicArn,
      exportName: `${env}-FileEventsTopicArn`,
    });
    new cdk.CfnOutput(this, 'NotificationsTopicArn', {
      value: this.notificationsTopic.topicArn,
      exportName: `${env}-NotificationsTopicArn`,
    });
    new cdk.CfnOutput(this, 'MailServiceQueueUrl', {
      value: this.mailServiceQueue.queueUrl,
      exportName: `${env}-MailServiceQueueUrl`,
    });
    new cdk.CfnOutput(this, 'FileProcessingQueueUrl', {
      value: this.fileProcessingQueue.queueUrl,
      exportName: `${env}-FileProcessingQueueUrl`,
    });
    new cdk.CfnOutput(this, 'MemberEventQueueUrl', {
      value: this.memberEventQueue.queueUrl,
      exportName: `${env}-MemberEventQueueUrl`,
    });
  }
}
