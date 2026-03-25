package com.demo.file.dto;

import com.demo.file.entity.FileMetadata;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileResponse {
    private UUID id;
    private String originalName;
    private String s3Key;
    private String s3Url;
    private String presignedUrl;
    private String contentType;
    private Long fileSize;
    private String uploadedBy;
    private LocalDateTime createdAt;

    public static FileResponse fromEntity(FileMetadata metadata, String presignedUrl) {
        return FileResponse.builder()
                .id(metadata.getId())
                .originalName(metadata.getOriginalName())
                .s3Key(metadata.getS3Key())
                .s3Url(metadata.getS3Url())
                .presignedUrl(presignedUrl)
                .contentType(metadata.getContentType())
                .fileSize(metadata.getFileSize())
                .uploadedBy(metadata.getUploadedBy())
                .createdAt(metadata.getCreatedAt())
                .build();
    }
}
