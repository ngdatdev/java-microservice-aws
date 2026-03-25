package com.demo.file.service;

import com.demo.file.dto.FileResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;

public interface FileService {
    FileResponse uploadFile(MultipartFile file, String uploadedBy);
    List<FileResponse> getAllFiles();
    FileResponse getFileMetadata(UUID id);
    void deleteFile(UUID id);
}
