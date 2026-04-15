package com.demo.file;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class FileServiceApplication {

    public static void main(String[] args) {
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(e -> System.setProperty(e.getKey(), e.getValue()));
            System.out.println("✔ .env loaded from service root");
        } catch (Exception e) {
            System.out.println("⚠ .env not found — relying on system env / defaults");
        }
        SpringApplication.run(FileServiceApplication.class, args);
    }

    @Bean
    public ApplicationRunner startupBanner(Environment env) {
        return args -> {
            String port      = env.getProperty("server.port", "8082");
            String appName  = env.getProperty("spring.application.name", "file-service");
            String baseUrl  = "http://localhost:" + port;
            String region   = env.getProperty("aws.region", "not set");
            String s3Bucket = env.getProperty("aws.s3.bucket-name", "not set");
            String snsTopic = env.getProperty("aws.sns.topic-arn", "not set");

            System.out.println();
            System.out.println("╔════════════════════════════════════════════════════════╗");
            System.out.println("║                 FILE SERVICE READY                   ║");
            System.out.println("╠════════════════════════════════════════════════════════╣");
            System.out.printf("║  Application : %-37s║%n", appName);
            System.out.printf("║  Local URL    : %-37s║%n", baseUrl);
            System.out.printf("║  Health       : %-37s║%n", baseUrl + "/actuator/health");
            System.out.println("╠════════════════════════════════════════════════════════╣");
            System.out.printf("║  AWS Region   : %-37s║%n", region);
            System.out.printf("║  S3 Bucket    : %-37s║%n", s3Bucket);
            System.out.printf("║  SNS Topic    : %-37s║%n", snsTopic);
            System.out.println("╚════════════════════════════════════════════════════════╝");
            System.out.println();
        };
    }
}
