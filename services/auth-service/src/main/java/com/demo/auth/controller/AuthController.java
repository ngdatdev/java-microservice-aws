package com.demo.auth.controller;

import com.demo.auth.entity.User;
import com.demo.auth.repository.UserRepository;
import com.demo.auth.service.CognitoService;
import com.demo.auth.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final CognitoService cognitoService;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String email = request.get("email");
        String fullName = request.get("fullName");

        String sub = cognitoService.signUp(username, password, email);
        
        User user = User.builder()
                .username(username)
                .email(email)
                .fullName(fullName)
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

        String cognitoToken = cognitoService.login(username, password);
        String jwtToken = jwtUtils.generateToken(username);

        return ResponseEntity.ok(Map.of(
                "cognito_id_token", cognitoToken,
                "access_token", jwtToken
        ));
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
