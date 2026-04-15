package com.demo.mail.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.sqs.SqsClient;
import java.net.URI;

@Configuration
public class AwsConfig {

    @Value("${aws.region:ap-southeast-1}")
    private String region;

    /**
     * Local endpoint (LocalStack). Empty = use real AWS.
     */
    @Value("${aws.ses.endpoint:}")
    private String sesEndpoint;

    @Value("${aws.sqs.endpoint:}")
    private String sqsEndpoint;

    @Bean
    public SesClient sesClient() {
        var builder = SesClient.builder().region(Region.of(region));
        if (!sesEndpoint.isBlank()) {
            builder.endpointOverride(URI.create(sesEndpoint));
        }
        builder.credentialsProvider(DefaultCredentialsProvider.create());
        return builder.build();
    }

    @Bean
    public SqsClient sqsClient() {
        var builder = SqsClient.builder().region(Region.of(region));
        if (!sqsEndpoint.isBlank()) {
            builder.endpointOverride(URI.create(sqsEndpoint));
        }
        builder.credentialsProvider(DefaultCredentialsProvider.create());
        return builder.build();
    }
}
