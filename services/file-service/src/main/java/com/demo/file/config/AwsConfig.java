package com.demo.file.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.sns.SnsClient;
import java.net.URI;

@Configuration
public class AwsConfig {

    @Value("${aws.region:ap-southeast-1}")
    private String region;

    /**
     * Local endpoint (LocalStack). Empty = use real AWS.
     * Set via AWS_S3_ENDPOINT / AWS_SNS_ENDPOINT env var.
     */
    @Value("${aws.s3.endpoint:}")
    private String s3Endpoint;

    @Value("${aws.sns.endpoint:}")
    private String snsEndpoint;

    private S3Client buildS3() {
        var builder = S3Client.builder().region(Region.of(region));
        if (!s3Endpoint.isBlank()) {
            builder.endpointOverride(URI.create(s3Endpoint))
                   .credentialsProvider(DefaultCredentialsProvider.create());
        } else {
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }
        return builder.forcePathStyle(true).build();
    }

    @Bean
    public S3Client s3Client() {
        return buildS3();
    }

    @Bean
    public S3Presigner s3Presigner() {
        var builder = S3Presigner.builder().region(Region.of(region));
        if (!s3Endpoint.isBlank()) {
            builder.endpointOverride(URI.create(s3Endpoint))
                   .credentialsProvider(DefaultCredentialsProvider.create());
        } else {
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }
        return builder.build();
    }

    @Bean
    public SnsClient snsClient() {
        var builder = SnsClient.builder().region(Region.of(region));
        if (!snsEndpoint.isBlank()) {
            builder.endpointOverride(URI.create(snsEndpoint))
                   .credentialsProvider(DefaultCredentialsProvider.create());
        } else {
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }
        return builder.build();
    }
}
