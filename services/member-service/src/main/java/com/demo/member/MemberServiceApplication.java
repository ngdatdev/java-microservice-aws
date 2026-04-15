package com.demo.member;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MemberServiceApplication {

    public static void main(String[] args) {
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(e -> System.setProperty(e.getKey(), e.getValue()));
            System.out.println("✔ .env loaded from service root");
        } catch (Exception e) {
            System.out.println("⚠ .env not found — relying on system env / defaults");
        }
        SpringApplication.run(MemberServiceApplication.class, args);
    }

    @Bean
    public ApplicationRunner startupBanner(Environment env) {
        return args -> {
            String port     = env.getProperty("server.port", "8081");
            String appName  = env.getProperty("spring.application.name", "member-service");
            String baseUrl  = "http://localhost:" + port;
            String region   = env.getProperty("aws.region", "not set");
            String snsTopic = env.getProperty("aws.sns.topic-arn", "not set");
            String sqsQueue = env.getProperty("aws.sqs.queue-url", "not set");

            System.out.println();
            System.out.println("╔════════════════════════════════════════════════════════╗");
            System.out.println("║                 MEMBER SERVICE READY                  ║");
            System.out.println("╠════════════════════════════════════════════════════════╣");
            System.out.printf("║  Application : %-37s║%n", appName);
            System.out.printf("║  Local URL    : %-37s║%n", baseUrl);
            System.out.printf("║  Health       : %-37s║%n", baseUrl + "/actuator/health");
            System.out.println("╠════════════════════════════════════════════════════════╣");
            System.out.printf("║  AWS Region   : %-37s║%n", region);
            System.out.printf("║  SNS Topic    : %-37s║%n", snsTopic);
            System.out.printf("║  SQS Queue    : %-37s║%n", sqsQueue);
            System.out.println("╚════════════════════════════════════════════════════════╝");
            System.out.println();
        };
    }
}
