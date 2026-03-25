package com.demo.master.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${services.member.url:http://localhost:8081}")
    private String memberServiceUrl;

    @Value("${services.file.url:http://localhost:8082}")
    private String fileServiceUrl;

    @Bean
    public WebClient memberWebClient() {
        return WebClient.builder().baseUrl(memberServiceUrl).build();
    }

    @Bean
    public WebClient fileWebClient() {
        return WebClient.builder().baseUrl(fileServiceUrl).build();
    }

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
