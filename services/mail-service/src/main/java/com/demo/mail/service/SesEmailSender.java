package com.demo.mail.service;

import com.demo.mail.entity.EmailLog;
import com.demo.mail.repository.EmailLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class SesEmailSender {

    private final SesClient sesClient;
    private final EmailLogRepository repository;

    @Value("${aws.ses.from-email:no-reply@demo.com}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) {
        EmailStatus status = EmailStatus.SUCCESS;
        String errorMessage = null;

        try {
            SendEmailRequest request = SendEmailRequest.builder()
                    .destination(Destination.builder().toAddresses(to).build())
                    .message(Message.builder()
                            .subject(Content.builder().data(subject).build())
                            .body(Body.builder().html(Content.builder().data(body).build()).build())
                            .build())
                    .source(fromEmail)
                    .build();

            sesClient.sendEmail(request);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}", to, e);
            status = EmailStatus.FAILED;
            errorMessage = e.getMessage();
        } finally {
            saveLog(to, subject, body, status, errorMessage);
        }
    }

    private void saveLog(String to, String subject, String body, EmailStatus status, String errorMessage) {
        EmailLog logEntry = EmailLog.builder()
                .toEmail(to)
                .subject(subject)
                .body(body)
                .status(status == EmailStatus.SUCCESS ? EmailLog.EmailStatus.SUCCESS : EmailLog.EmailStatus.FAILED)
                .errorMessage(errorMessage)
                .sentAt(LocalDateTime.now())
                .build();
        repository.save(logEntry);
    }

    private enum EmailStatus {
        SUCCESS, FAILED
    }
}
