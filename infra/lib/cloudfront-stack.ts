import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export interface CloudFrontStackProps extends cdk.StackProps {
  envName: string;
  apiGatewayDomain: string;
}

export class CloudFrontStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly frontendBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id, props);

    const { envName, apiGatewayDomain } = props;

    // Frontend S3 bucket is created here to avoid cross-stack OAC policy cycle
    this.frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `aws-micro-demo-frontend-${envName}-${this.account}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront access logs S3 bucket
    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `aws-micro-demo-cf-logs-${envName}-${this.account}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // T021: T022: Cache policy for static assets (aggressive caching)
    const staticAssetsCachePolicy = new cloudfront.CachePolicy(this, 'StaticAssetsCachePolicy', {
      cachePolicyName: `aws-micro-demo-static-cache-${envName}`,
      comment: 'Cache policy for static frontend assets',
      defaultTtl: cdk.Duration.days(1),
      minTtl: cdk.Duration.hours(1),
      maxTtl: cdk.Duration.days(365),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
    });

    // T022: Cache policy for API pass-through (no caching)
    const apiPassThroughCachePolicy = new cloudfront.CachePolicy(this, 'ApiPassThroughCachePolicy', {
      cachePolicyName: `aws-micro-demo-api-cache-${envName}`,
      comment: 'No-cache policy for API pass-through',
      defaultTtl: cdk.Duration.seconds(0),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.seconds(1),
      enableAcceptEncodingGzip: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Authorization', 'Content-Type'),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
    });

    // T021: OAC (Origin Access Control) for S3
    const oac = new cloudfront.S3OriginAccessControl(this, 'DemoOac', {
      originAccessControlName: `aws-micro-demo-oac-${envName}`,
      description: 'OAC for frontend S3 bucket',
    });

    // T021: CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'DemoDistribution', {
      comment: `aws-micro-demo CloudFront distribution (${envName})`,
      defaultRootObject: 'index.html',
      logBucket: accessLogsBucket,
      logFilePrefix: `cloudfront-logs/`,
      defaultBehavior: {
        // Frontend static assets via S3 OAC
        origin: origins.S3BucketOrigin.withOriginAccessControl(
          this.frontendBucket,
          { originAccessControl: oac },
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: staticAssetsCachePolicy,
        compress: true,
      },
      additionalBehaviors: {
        // T022: API pass-through to API Gateway
        '/api/*': {
          origin: new origins.HttpOrigin(apiGatewayDomain, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: apiPassThroughCachePolicy,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      errorResponses: [
        // SPA fallback — redirect 403/404 to index.html
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.frontendBucket.bucketName,
      description: 'S3 bucket name for frontend static assets',
      exportName: `${envName}-FrontendBucketName`,
    });

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
      exportName: `${envName}-CloudFrontDomainName`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: `${envName}-CloudFrontDistributionId`,
    });

    new cdk.CfnOutput(this, 'AccessLogsBucketName', {
      value: accessLogsBucket.bucketName,
      description: 'S3 bucket for CloudFront access logs',
      exportName: `${envName}-AccessLogsBucketName`,
    });
  }
}
