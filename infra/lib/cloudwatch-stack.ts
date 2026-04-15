import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ecs from 'aws-cdk-lib/aws-ecs';

export interface CloudWatchStackProps extends cdk.StackProps {
  envName: string;
  cluster: ecs.ICluster;
  serviceNames: string[];
  mailDlqArn: string;
}

export class CloudWatchStack extends cdk.Stack {
  public readonly alarmTopic: sns.ITopic;

  constructor(scope: Construct, id: string, props: CloudWatchStackProps) {
    super(scope, id, props);

    const { envName, cluster, serviceNames } = props;

    // T025: SNS Notification Topic for Alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmNotificationTopic', {
      topicName: `aws-micro-demo-alarms-${envName}`,
      displayName: `AWS Micro Demo Alarms (${envName})`,
    });

    const alarmAction = new cloudwatch_actions.SnsAction(this.alarmTopic);

    // T023: Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'DemoDashboard', {
      dashboardName: `aws-micro-demo-dashboard-${envName}`,
    });

    const cpuWidgets: cloudwatch.IWidget[] = [];
    const memWidgets: cloudwatch.IWidget[] = [];
    const alarms: cloudwatch.Alarm[] = [];

    for (const serviceName of serviceNames) {
      const svcId = serviceName
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
      const fullServiceName = `${serviceName}-${envName}`;

      // CPU Utilization metric
      const cpuMetric = new cloudwatch.Metric({
        namespace: 'AWS/ECS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          ClusterName: cluster.clusterName,
          ServiceName: fullServiceName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      });

      // Memory Utilization metric
      const memMetric = new cloudwatch.Metric({
        namespace: 'AWS/ECS',
        metricName: 'MemoryUtilization',
        dimensionsMap: {
          ClusterName: cluster.clusterName,
          ServiceName: fullServiceName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      });

      cpuWidgets.push(
        new cloudwatch.GraphWidget({
          title: `CPU Utilization — ${serviceName}`,
          left: [cpuMetric],
          leftYAxis: { min: 0, max: 100, label: '%' },
          width: 8,
          height: 6,
        }),
      );

      memWidgets.push(
        new cloudwatch.GraphWidget({
          title: `Memory Utilization — ${serviceName}`,
          left: [memMetric],
          leftYAxis: { min: 0, max: 100, label: '%' },
          width: 8,
          height: 6,
        }),
      );

      // T024: CPU Alarm — >80% for 2 consecutive periods
      const cpuAlarm = new cloudwatch.Alarm(this, `${svcId}CpuAlarm`, {
        alarmName: `aws-micro-demo-${serviceName}-cpu-high-${envName}`,
        alarmDescription: `CPU utilization > 80% for ${serviceName}`,
        metric: cpuMetric,
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      cpuAlarm.addAlarmAction(alarmAction);
      cpuAlarm.addOkAction(alarmAction);
      alarms.push(cpuAlarm);
    }

    // T024: TCP Reset Rate Alarm on NLB
    const nlbTcpResetMetric = new cloudwatch.Metric({
      namespace: 'AWS/NetworkELB',
      metricName: 'TCP_Reset_Count',
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    });

    const nlbTcpResetAlarm = new cloudwatch.Alarm(this, 'NlbTcpResetAlarm', {
      alarmName: `aws-micro-demo-nlb-tcp-reset-high-${envName}`,
      alarmDescription: 'NLB TCP reset count > 10 per minute',
      metric: nlbTcpResetMetric,
      threshold: 10,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    nlbTcpResetAlarm.addAlarmAction(alarmAction);
    alarms.push(nlbTcpResetAlarm);

    // DLQ depth alarm
    const mailDlq = sqs.Queue.fromQueueArn(this, 'MailDlqRef', props.mailDlqArn);
    const dlqDepthAlarm = new cloudwatch.Alarm(this, 'MailDlqDepthAlarm', {
      alarmName: `aws-micro-demo-mail-dlq-depth-${envName}`,
      alarmDescription: 'Mail DLQ has messages — investigate failed message processing',
      metric: mailDlq.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.minutes(5),
        statistic: 'Maximum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    dlqDepthAlarm.addAlarmAction(alarmAction);
    alarms.push(dlqDepthAlarm);

    // T023: Composite Alarm widget for alarm overview
    const alarmStatusWidget = new cloudwatch.AlarmStatusWidget({
      title: 'Alarm Overview',
      alarms,
      width: 24,
      height: 4,
    });

    const errorWidget = new cloudwatch.GraphWidget({
      title: 'NLB TCP Resets',
      left: [nlbTcpResetMetric],
      width: 8,
      height: 6,
    });

    dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `# AWS Micro Demo — ${envName.toUpperCase()} Dashboard`,
        width: 24,
        height: 2,
      }),
      alarmStatusWidget,
      ...cpuWidgets,
      ...memWidgets,
      errorWidget,
    );

    // Outputs
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'SNS topic ARN for alarm notifications',
      exportName: `${envName}-AlarmTopicArn`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home#dashboards:name=${envName === 'dev' ? `aws-micro-demo-dashboard-${envName}` : `aws-micro-demo-dashboard-${envName}`}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
