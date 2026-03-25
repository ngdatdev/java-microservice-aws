package com.demo.file.service;

import com.demo.file.dto.FileResponse;
import com.demo.file.entity.FileMetadata;
import com.demo.file.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileServiceImpl implements FileService {

    private final FileMetadataRepository repository;
    private final S3Service s3Service;

    @Override
    @Transactional
    public FileResponse uploadFile(MultipartFile file, String uploadedBy) {
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String key = "uploads/" + LocalDateTime.now().getYear() + "/" + UUID.randomUUID() + extension;

            String s3Url = s3Service.uploadFile(key, file.getBytes(), file.getContentType());

            FileMetadata metadata = FileMetadata.builder()
                    .originalName(originalFilename)
                    .s3Key(key)
                    .s3Url(s3Url)
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .uploadedBy(uploadedBy)
                    .build();

            FileMetadata saved = repository.save(metadata);
            String presignedUrl = s3Service.generatePresignedUrl(key);

            log.info("File uploaded successfully: {}", originalFilename);
            return FileResponse.fromEntity(saved, presignedUrl);
        } catch (Exception e) {
            log.error("Failed to upload file", e);
            throw new RuntimeException("File upload failed", e);
        }
    }

    @Override
    public List<FileResponse> getAllFiles() {
        return repository.findAll().stream()
                .map(m -> FileResponse.fromEntity(m, s3Service.generatePresignedUrl(m.getS3Key())))
                .collect(Collectors.toList());
    }

    @Override
    public FileResponse getFileMetadata(UUID id) {
        FileMetadata metadata = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));
        return FileResponse.fromEntity(metadata, s3Service.generatePresignedUrl(metadata.getS3Key()));
    }

    @Override
    @Transactional
    public void deleteFile(UUID id) {
        FileMetadata metadata = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));
        s3Service.deleteFile(metadata.getS3Key());
        repository.delete(metadata);
    }
}
