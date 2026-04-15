package com.demo.auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import java.net.URI;

@Configuration
public class AwsConfig {

    @Value("${aws.region:ap-northeast-1}")
    private String region;

    /**
     * Local profile: use LocalStack endpoint for offline development.
     * Prod profile: omit endpoint override → connects to real AWS.
     */
    @Value("${aws.cognito.endpoint:}")
    private String cognitoEndpoint;

    @Bean
    public CognitoIdentityProviderClient cognitoClient() {
        var builder = CognitoIdentityProviderClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create());

        // Only override endpoint when LocalStack URL is explicitly set
        if (cognitoEndpoint != null && !cognitoEndpoint.isBlank()) {
            builder.endpointOverride(URI.create(cognitoEndpoint));
        }

        return builder.build();
    }
}
