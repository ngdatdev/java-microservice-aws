package com.demo.mail.controller;

import com.demo.mail.entity.EmailLog;
import com.demo.mail.repository.EmailLogRepository;
import com.demo.mail.service.EmailSender;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/mail")
@RequiredArgsConstructor
public class MailController {

    private final EmailSender emailSender;
    private final EmailLogRepository repository;

    @PostMapping("/send")
    public ResponseEntity<String> sendEmail(@RequestBody Map<String, String> request) {
        String to = request.get("to");
        String subject = request.get("subject");
        String body = request.get("body");

        emailSender.sendEmail(to, subject, body);
        return ResponseEntity.ok("Email sent (mock)");
    }

    @GetMapping("/logs")
    public ResponseEntity<Page<EmailLog>> getLogs(Pageable pageable) {
        return ResponseEntity.ok(repository.findAll(pageable));
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("UP");
    }
}
