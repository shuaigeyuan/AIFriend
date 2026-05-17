export interface StorageConfig {
  provider: 'aws-s3' | 'aliyun-oss';
  region: string;
  endpoint?: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  cdnEndpoint?: string;
}

export interface UploadOptions {
  key: string;
  body: Buffer | Blob | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  url: string;
  key: string;
  etag?: string;
}

export interface DeleteResult {
  success: boolean;
  key: string;
}

export interface StorageProvider {
  name: string;
  upload(options: UploadOptions): Promise<UploadResult>;
  delete(key: string): Promise<DeleteResult>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  getPublicUrl(key: string): string;
}

export interface WeightedStorageProvider {
  provider: StorageProvider;
  weight: number;
}

export interface MultiStorageConfig {
  providers: WeightedStorageProvider[];
}

export interface BalancedStorageProvider extends StorageProvider {
  name: 'balanced-storage';
  getActiveProvider(): StorageProvider;
  getStats(): {
    providerName: string;
    requestCount: number;
    failureCount: number;
    lastFailure: number | null;
  }[];
}

export type StorageMode = 'single' | 'weighted';
