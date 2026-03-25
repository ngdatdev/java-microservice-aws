package com.demo.file.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class SnsPublisher {

    private final SnsClient snsClient;
    private final ObjectMapper objectMapper;

    @Value("${aws.sns.topic-arn:arn:aws:sns:ap-northeast-1:000000000000:global-notifications}")
    private String topicArn;

    public void publishFileEvent(String eventType, UUID fileId, String fileName) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("event", eventType);
            message.put("fileId", fileId.toString());
            message.put("fileName", fileName);
            message.put("timestamp", LocalDateTime.now().toString());

            String jsonMessage = objectMapper.writeValueAsString(message);

            PublishRequest request = PublishRequest.builder()
                    .topicArn(topicArn)
                    .message(jsonMessage)
                    .build();

            snsClient.publish(request);
            log.info("Published {} event for file: {}", eventType, fileName);
        } catch (Exception e) {
            log.error("Failed to publish SNS event", e);
        }
    }
}
