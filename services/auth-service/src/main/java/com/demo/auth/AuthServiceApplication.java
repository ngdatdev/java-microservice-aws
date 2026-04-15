package com.demo.auth;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class AuthServiceApplication {

    public static void main(String[] args) {
        // Load .env from project root before Spring starts
        try {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .load();
            dotenv.entries().forEach(e ->
                    System.setProperty(e.getKey(), e.getValue()));
            System.out.println("✔ .env loaded from project root");
        } catch (Exception e) {
            System.out.println("⚠ .env not found or unreadable — relying on system env / defaults");
        }

        SpringApplication.run(AuthServiceApplication.class, args);
    }

    @Bean
    public ApplicationRunner startupBanner(Environment env) {
        return args -> {
            String port   = env.getProperty("server.port", "8084");
            String appName = env.getProperty("spring.application.name", "auth-service");
            String baseUrl = "http://localhost:" + port;

            System.out.println();
            System.out.println("╔══════════════════════════════════════════════════════╗");
            System.out.println("║                  AUTH SERVICE READY                   ║");
            System.out.println("╠══════════════════════════════════════════════════════╣");
            System.out.printf("║  Application : %-36s║%n", appName);
            System.out.printf("║  Local URL    : %-36s║%n", baseUrl);
            System.out.printf("║  Health       : %-36s║%n", baseUrl + "/actuator/health");
            System.out.printf("║  Swagger UI   : %-36s║%n", baseUrl + "/swagger-ui.html");
            System.out.printf("║  API Docs     : %-36s║%n", baseUrl + "/v3/api-docs");
            System.out.println("╠══════════════════════════════════════════════════════╣");
            System.out.printf("║  AWS Region   : %-36s║%n", env.getProperty("aws.region", "not set"));
            System.out.printf("║  Cognito Pool : %-36s║%n", env.getProperty("aws.cognito.user-pool-id", "not set"));
            System.out.printf("║  Cognito Client: %-35s║%n", env.getProperty("aws.cognito.client-id", "not set"));
            System.out.printf("║  DB Host      : %-36s║%n", env.getProperty("spring.datasource.url", "not set"));
            System.out.println("╚══════════════════════════════════════════════════════╝");
            System.out.println();
        };
    }
}
