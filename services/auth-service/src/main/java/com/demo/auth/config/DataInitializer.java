package com.demo.auth.config;

import com.demo.auth.entity.User;
import com.demo.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UserNotFoundException;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CognitoIdentityProviderClient cognitoClient;

    @Value("${aws.cognito.user-pool-id}")
    private String userPoolId;

    @Override
    public void run(String... args) {
        seedAdminUser();
    }

    private void seedAdminUser() {
        String adminEmail = "admin@example.com";
        
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            log.info("Seeding default admin user: {}", adminEmail);
            
            try {
                // Try to get the user from Cognito to get their Sub
                AdminGetUserRequest getRequest = AdminGetUserRequest.builder()
                        .userPoolId(userPoolId)
                        .username(adminEmail)
                        .build();
                
                AdminGetUserResponse getResponse = cognitoClient.adminGetUser(getRequest);
                String sub = getResponse.userAttributes().stream()
                        .filter(attr -> attr.name().equals("sub"))
                        .findFirst()
                        .map(attr -> attr.value())
                        .orElse(null);

                if (sub != null) {
                    User admin = User.builder()
                            .username(adminEmail)
                            .email(adminEmail)
                            .fullName("System Administrator")
                            .cognitoSub(sub)
                            .status(User.UserStatus.ACTIVE)
                            .build();
                    
                    userRepository.save(admin);
                    log.info("Admin user seeded successfully with sub: {}", sub);
                } else {
                    log.warn("Could not find 'sub' attribute for admin user in Cognito");
                }
                
            } catch (UserNotFoundException e) {
                log.warn("Admin user not found in Cognito User Pool. Please ensure localstack-init.sh has run.");
            } catch (Exception e) {
                log.error("Error during admin user seeding: {}", e.getMessage());
            }
        } else {
            log.info("Admin user already exists in database.");
        }
    }
}
