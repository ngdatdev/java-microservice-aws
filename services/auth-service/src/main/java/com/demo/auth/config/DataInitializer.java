package com.demo.auth.config;

import com.demo.auth.entity.User;
import com.demo.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdminUser();
    }

    private void seedAdminUser() {
        String adminEmail = "admin@example.com";

        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            log.info("Seeding default admin user: {}", adminEmail);

            User admin = User.builder()
                    .username(adminEmail)
                    .email(adminEmail)
                    .fullName("System Administrator")
                    .passwordHash(passwordEncoder.encode("Password123!"))
                    .cognitoSub("local-dev-admin-" + UUID.randomUUID())
                    .status(User.UserStatus.ACTIVE)
                    .build();

            userRepository.save(admin);
            log.info("Default admin user seeded successfully.");
        } else {
            log.info("Admin user already exists, skipping seed.");
        }
    }
}
