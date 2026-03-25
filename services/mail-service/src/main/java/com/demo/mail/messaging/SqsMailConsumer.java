package com.demo.mail.messaging;

import com.demo.mail.service.SesEmailSender;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.DeleteMessageRequest;
import software.amazon.awssdk.services.sqs.model.Message;
import software.amazon.awssdk.services.sqs.model.ReceiveMessageRequest;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class SqsMailConsumer {

    private final SqsClient sqsClient;
    private final SesEmailSender emailSender;
    private final ObjectMapper objectMapper;

    @Value("${aws.sqs.mail-queue-url:http://localhost:4566/000000000000/mail-queue}")
    private String queueUrl;

    @Scheduled(fixedDelay = 5000)
    public void consumeMessages() {
        try {
            ReceiveMessageRequest receiveRequest = ReceiveMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .maxNumberOfMessages(5)
                    .waitTimeSeconds(10)
                    .build();

            List<Message> messages = sqsClient.receiveMessage(receiveRequest).messages();

            for (Message message : messages) {
                processMessage(message);
                
                sqsClient.deleteMessage(DeleteMessageRequest.builder()
                        .queueUrl(queueUrl)
                        .receiptHandle(message.receiptHandle())
                        .build());
            }
        } catch (Exception e) {
            log.error("Error consuming mail messages from SQS", e);
        }
    }

    private void processMessage(Message message) {
        try {
            log.info("Processing mail message: {}", message.messageId());
            Map<String, Object> payload = objectMapper.readValue(message.body(), Map.class);
            
            String to = (String) payload.get("to");
            String subject = (String) payload.get("subject");
            String body = (String) payload.get("body");
            
            if (to != null && subject != null && body != null) {
                emailSender.sendEmail(to, subject, body);
            } else {
                log.warn("Invalid mail message format: {}", message.body());
            }
        } catch (Exception e) {
            log.error("Failed to process mail message", e);
        }
    }
}
