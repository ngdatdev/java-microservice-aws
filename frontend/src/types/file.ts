export interface FileMetadata {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  s3Url: string;
  uploadedBy: string;
  uploadedAt: string;
}
