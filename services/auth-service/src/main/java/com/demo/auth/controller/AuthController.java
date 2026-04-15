package com.demo.auth.controller;

import com.demo.auth.entity.User;
import com.demo.auth.repository.UserRepository;
import com.demo.auth.service.CognitoService;
import com.demo.auth.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final CognitoService cognitoService;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String email = request.get("email");
        String fullName = request.get("fullName");

        // Try Cognito first; fall back to local-only signup in dev
        String sub;
        try {
            sub = cognitoService.signUp(username, password, email);
        } catch (Exception e) {
            log.warn("Cognito signup failed (likely LocalStack Community limitation), registering locally: {}", e.getMessage());
            sub = "local-dev-" + java.util.UUID.randomUUID();
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "User with this email already exists"));
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .fullName(fullName)
                .passwordHash(passwordEncoder.encode(password))
                .cognitoSub(sub)
                .status(User.UserStatus.ACTIVE)
                .build();
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User registered successfully", "sub", sub));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        // Try local DB authentication first (works in local dev without Cognito)
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByEmail(username);
        }

        // if (userOptional.isPresent()) {
        //     User user = userOptional.get();
        //     if (user.getPasswordHash() != null && passwordEncoder.matches(password, user.getPasswordHash())) {
        //         String jwtToken = jwtUtils.generateToken(username);
        //         log.info("Local DB login successful for user: {}", username);
        //         return ResponseEntity.ok(Map.of(
        //                 "cognito_id_token", jwtToken, // reuse same field for compatibility
        //                 "access_token", jwtToken
        //         ));
        //     }
        // }

        // Fall back to Cognito (for real AWS environment)
        try {
            String cognitoToken = cognitoService.login(username, password);
            String jwtToken = jwtUtils.generateToken(username);
            return ResponseEntity.ok(Map.of(
                    "cognito_id_token", cognitoToken,
                    "access_token", jwtToken
            ));
        } catch (Exception e) {
            log.warn("Cognito login also failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String token) {
        String jwt = token.substring(7);
        String username = jwtUtils.extractUsername(jwt);
        return ResponseEntity.ok(userRepository.findByUsername(username));
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("UP");
    }
}
