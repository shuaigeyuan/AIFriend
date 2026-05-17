import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  StorageProvider,
  StorageConfig,
  UploadOptions,
  UploadResult,
  DeleteResult,
} from '@/types/storage';

export interface S3StorageConfig extends StorageConfig {
  forcePathStyle?: boolean;
}

function createS3Client(config: S3StorageConfig): S3Client {
  const clientConfig: Record<string, unknown> = {
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.accessKeySecret,
    },
  };

  if (config.endpoint) {
    clientConfig.endpoint = config.endpoint;
    clientConfig.forcePathStyle = config.forcePathStyle ?? true;
  }

  return new S3Client(clientConfig as Parameters<typeof S3Client>[0]);
}

function guessContentType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
    json: 'application/json',
  };
  return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
}

export function createS3StorageProvider(config: S3StorageConfig): StorageProvider {
  const client = createS3Client(config);
  const isAliyun = config.provider === 'aliyun-oss';

  const getEndpoint = (): string => {
    if (config.cdnEndpoint) {
      return config.cdnEndpoint;
    }
    if (config.endpoint) {
      return config.endpoint.replace(/^https?:\/\//, '');
    }
    return `s3.${config.region}.amazonaws.com`;
  };

  return {
    name: config.provider,

    async upload(options: UploadOptions): Promise<UploadResult> {
      const { key, body, contentType, metadata } = options;
      const finalContentType = contentType ?? guessContentType(key);

      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: finalContentType,
        Metadata: metadata,
      });

      const response = await client.send(command);

      return {
        url: `https://${getEndpoint()}/${config.bucket}/${key}`,
        key,
        etag: response.ETag,
      };
    },

    async delete(key: string): Promise<DeleteResult> {
      const command = new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      });

      await client.send(command);

      return {
        success: true,
        key,
      };
    },

    async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
      const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      });

      return getSignedUrl(client, command, { expiresIn });
    },

    getPublicUrl(key: string): string {
      if (config.cdnEndpoint) {
        return `${config.cdnEndpoint.replace(/\/$/, '')}/${key}`;
      }
      return `https://${getEndpoint()}/${config.bucket}/${key}`;
    },
  };
}

export type { S3StorageConfig as AliyunOSSConfig };
