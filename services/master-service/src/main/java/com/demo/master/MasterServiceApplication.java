package com.demo.master;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class MasterServiceApplication {

    public static void main(String[] args) {
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(e -> System.setProperty(e.getKey(), e.getValue()));
            System.out.println("✔ .env loaded from service root");
        } catch (Exception e) {
            System.out.println("⚠ .env not found — relying on system env / defaults");
        }
        SpringApplication.run(MasterServiceApplication.class, args);
    }

    @Bean
    public ApplicationRunner startupBanner(Environment env) {
        return args -> {
            String port          = env.getProperty("server.port", "8085");
            String appName      = env.getProperty("spring.application.name", "master-service");
            String baseUrl      = "http://localhost:" + port;
            String memberSvcUrl = env.getProperty("services.member.url", "not set");
            String fileSvcUrl   = env.getProperty("services.file.url", "not set");

            System.out.println();
            System.out.println("╔════════════════════════════════════════════════════════╗");
            System.out.println("║                MASTER SERVICE READY                    ║");
            System.out.println("╠════════════════════════════════════════════════════════╣");
            System.out.printf("║  Application : %-37s║%n", appName);
            System.out.printf("║  Local URL    : %-37s║%n", baseUrl);
            System.out.printf("║  Health       : %-37s║%n", baseUrl + "/actuator/health");
            System.out.println("╠════════════════════════════════════════════════════════╣");
            System.out.printf("║  Member Svc   : %-37s║%n", memberSvcUrl);
            System.out.printf("║  File Svc     : %-37s║%n", fileSvcUrl);
            System.out.println("╚════════════════════════════════════════════════════════╝");
            System.out.println();
        };
    }
}
