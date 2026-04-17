import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigwv2_authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface RouteConfig {
  path: string;
  port: number;
  requireAuth: boolean;
}

export interface ApiGatewayNlbStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.IVpc;
  userPool: cognito.IUserPool;
  userPoolClient: cognito.IUserPoolClient;
}

const ROUTE_CONFIGS: RouteConfig[] = [
  { path: '/api/v1/members/{proxy+}', port: 8081, requireAuth: true },
  { path: '/api/v1/files/{proxy+}', port: 8082, requireAuth: true },
  { path: '/api/v1/mails/{proxy+}', port: 8083, requireAuth: true },
  { path: '/api/v1/auth/{proxy+}', port: 8084, requireAuth: false },
  { path: '/api/v1/master/{proxy+}', port: 8085, requireAuth: true },
];

export class ApiGatewayNlbStack extends cdk.Stack {
  public readonly httpApi: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props: ApiGatewayNlbStackProps) {
    super(scope, id, props);

    const { envName, vpc, userPool, userPoolClient } = props;

    // T018: VPC Link to internal NLB
    const vpcLink = new apigwv2.VpcLink(this, 'DemoVpcLink', {
      vpcLinkName: `aws-micro-demo-vpc-link-${envName}`,
      vpc,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // T018: HTTP API Gateway (v2)
    this.httpApi = new apigwv2.HttpApi(this, 'DemoHttpApi', {
      apiName: `aws-micro-demo-api-${envName}`,
      description: 'HTTP API Gateway for aws-micro-demo microservices',
      corsPreflight: {
        allowHeaders: ['Authorization', 'Content-Type'],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['*'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // T019: JWT Authorizer using Cognito
    const jwtAuthorizer = new apigwv2_authorizers.HttpJwtAuthorizer(
      'CognitoJwtAuthorizer',
      `https://cognito-idp.${this.region}.amazonaws.com/${(userPool as cognito.UserPool).userPoolId}`,
      {
        jwtAudience: [userPoolClient.userPoolClientId],
        authorizerName: `aws-micro-demo-jwt-auth-${envName}`,
      },
    );

    // T019: Routes with/without JWT authorization per contract
    for (const route of ROUTE_CONFIGS) {
      const listenerArn = cdk.Fn.importValue(`${envName}-NlbListener${route.port}Arn`);
      const nlbListener = elbv2.NetworkListener.fromNetworkListenerArn(
        this,
        `NlbListener${route.port}`,
        listenerArn,
      );
      const integration = new apigwv2_integrations.HttpNlbIntegration(
        `NlbIntegration${route.port}`,
        nlbListener,
        {
          vpcLink,
        },
      );

      this.httpApi.addRoutes({
        path: route.path,
        methods: [apigwv2.HttpMethod.ANY],
        integration,
        authorizer: route.requireAuth ? jwtAuthorizer : new apigwv2.HttpNoneAuthorizer(),
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.httpApi.apiEndpoint,
      description: 'HTTP API Gateway base URL',
      exportName: `${envName}-ApiGatewayUrl`,
    });
  }
}
