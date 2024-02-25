import { StorageClient, UploadFileInput, UploadFileOutput } from "../storage-client";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export class AWSS3StorageClient implements StorageClient {
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client();
  }

  async uploadFile({
    bucketName,
    file,
    key,
    contentType,
  }: UploadFileInput): Promise<UploadFileOutput> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    const putObjectCommandOutput = await this.s3Client.send(command);
    console.log(`putObjectCommandOutput:`, JSON.stringify(putObjectCommandOutput, null, 2));

    return { url: '' };
  }
}