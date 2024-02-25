
export type UploadFileSupportedContentType = 'text/csv';

export interface UploadFileInput {
  bucketName: string;
  key: string;
  file: Buffer;
  contentType: UploadFileSupportedContentType;
}

export interface UploadFileOutput {
  url: string;
}

export interface StorageClient {
  uploadFile(i: UploadFileInput): Promise<UploadFileOutput>;
}