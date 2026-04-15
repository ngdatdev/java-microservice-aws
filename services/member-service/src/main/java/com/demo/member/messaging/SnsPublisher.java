package com.demo.member.messaging;

import com.demo.member.entity.Member;
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

@Component
@RequiredArgsConstructor
@Slf4j
public class SnsPublisher {

    private final SnsClient snsClient;
    private final ObjectMapper objectMapper;

    @Value("${aws.sns.topic-arn:arn:aws:sns:ap-southeast-1:000000000000:global-notifications}")
    private String topicArn;

    public void publishMemberEvent(String eventType, Member member) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("event", eventType);
            message.put("memberId", member.getId().toString());
            message.put("email", member.getEmail());
            message.put("timestamp", LocalDateTime.now().toString());

            String jsonMessage = objectMapper.writeValueAsString(message);

            PublishRequest request = PublishRequest.builder()
                    .topicArn(topicArn)
                    .message(jsonMessage)
                    .build();

            snsClient.publish(request);
            log.info("Published {} event for member: {}", eventType, member.getEmail());
        } catch (Exception e) {
            log.error("Failed to publish SNS event", e);
        }
    }
}
