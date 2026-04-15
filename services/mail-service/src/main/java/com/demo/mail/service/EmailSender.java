package com.demo.mail.service;

import com.demo.mail.entity.EmailLog;
import com.demo.mail.repository.EmailLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

/**
 * Mock email sender — logs email instead of sending via SES.
 * Replace with real SMTP or 3rd-party provider (SendGrid, Mailgun...) when needed.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailSender {

    private final EmailLogRepository repository;

    public void sendEmail(String to, String subject, String body) {
        log.info("📧 [MOCK] Sending email to: {} | subject: {}", to, subject);

        EmailLog logEntry = EmailLog.builder()
                .toEmail(to)
                .subject(subject)
                .body(body)
                .status(EmailLog.EmailStatus.SUCCESS) // always success in mock
                .sentAt(LocalDateTime.now())
                .build();
        repository.save(logEntry);
    }
}
