import type { StorageProvider, BalancedStorageProvider } from '@/types/storage';
import { createS3StorageProvider, type S3StorageConfig } from './s3';
import { createBalancedStorageProvider } from './balanced';

interface StorageFactoryConfig {
  mode: 'single' | 'balanced';
  awsS3?: S3StorageConfig;
  aliyunOSS?: S3StorageConfig;
  weights?: { awsS3: number; aliyunOSS: number };
}

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function createProviderFromConfig(config: S3StorageConfig): StorageProvider {
  return createS3StorageProvider(config);
}

export function createStorageProvider(
  mode: 'single' | 'balanced' = 'single'
): StorageProvider | BalancedStorageProvider {
  const storageMode = getEnvOrDefault('STORAGE_MODE', mode);

  const awsS3Enabled = getEnvOrDefault('AWS_S3_ENABLED', 'true') === 'true';
  const aliyunOSSEnabled = getEnvOrDefault('ALIYUN_OSS_ENABLED', 'false') === 'true';

  if (storageMode === 'balanced' && awsS3Enabled && aliyunOSSEnabled) {
    const awsWeight = parseFloat(getEnvOrDefault('AWS_S3_WEIGHT', '0.5'));
    const aliyunWeight = parseFloat(getEnvOrDefault('ALIYUN_OSS_WEIGHT', '0.5'));

    const awsConfig: S3StorageConfig = {
      provider: 'aws-s3',
      region: getEnvOrDefault('AWS_S3_REGION', 'us-east-1'),
      endpoint: getEnvOrDefault('AWS_S3_ENDPOINT', ''),
      bucket: getEnvOrDefault('AWS_S3_BUCKET', ''),
      accessKeyId: getEnvOrDefault('AWS_S3_ACCESS_KEY_ID', ''),
      accessKeySecret: getEnvOrDefault('AWS_S3_ACCESS_KEY_SECRET', ''),
      cdnEndpoint: getEnvOrDefault('AWS_S3_CDN_ENDPOINT', ''),
      forcePathStyle: true,
    };

    const aliyunConfig: S3StorageConfig = {
      provider: 'aliyun-oss',
      region: getEnvOrDefault('ALIYUN_OSS_REGION', 'oss-cn-hangzhou'),
      endpoint: getEnvOrDefault('ALIYUN_OSS_ENDPOINT', ''),
      bucket: getEnvOrDefault('ALIYUN_OSS_BUCKET', ''),
      accessKeyId: getEnvOrDefault('ALIYUN_OSS_ACCESS_KEY_ID', ''),
      accessKeySecret: getEnvOrDefault('ALIYUN_OSS_ACCESS_KEY_SECRET', ''),
      cdnEndpoint: getEnvOrDefault('ALIYUN_OSS_CDN_ENDPOINT', ''),
      forcePathStyle: true,
    };

    return createBalancedStorageProvider({
      providers: [
        { provider: createProviderFromConfig(awsConfig), weight: awsWeight },
        { provider: createProviderFromConfig(aliyunConfig), weight: aliyunWeight },
      ],
    });
  }

  if (aliyunOSSEnabled) {
    const aliyunConfig: S3StorageConfig = {
      provider: 'aliyun-oss',
      region: getEnvOrDefault('ALIYUN_OSS_REGION', 'oss-cn-hangzhou'),
      endpoint: getEnvOrDefault('ALIYUN_OSS_ENDPOINT', ''),
      bucket: getEnvOrDefault('ALIYUN_OSS_BUCKET', ''),
      accessKeyId: getEnvOrDefault('ALIYUN_OSS_ACCESS_KEY_ID', ''),
      accessKeySecret: getEnvOrDefault('ALIYUN_OSS_ACCESS_KEY_SECRET', ''),
      cdnEndpoint: getEnvOrDefault('ALIYUN_OSS_CDN_ENDPOINT', ''),
      forcePathStyle: true,
    };

    return createProviderFromConfig(aliyunConfig);
  }

  const awsConfig: S3StorageConfig = {
    provider: 'aws-s3',
    region: getEnvOrDefault('AWS_S3_REGION', 'us-east-1'),
    endpoint: getEnvOrDefault('AWS_S3_ENDPOINT', ''),
    bucket: getEnvOrDefault('AWS_S3_BUCKET', ''),
    accessKeyId: getEnvOrDefault('AWS_S3_ACCESS_KEY_ID', ''),
    accessKeySecret: getEnvOrDefault('AWS_S3_ACCESS_KEY_SECRET', ''),
    cdnEndpoint: getEnvOrDefault('AWS_S3_CDN_ENDPOINT', ''),
    forcePathStyle: true,
  };

  return createProviderFromConfig(awsConfig);
}

let storageInstance: StorageProvider | BalancedStorageProvider | null = null;

export function getStorageProvider(): StorageProvider | BalancedStorageProvider {
  if (!storageInstance) {
    storageInstance = createStorageProvider();
  }
  return storageInstance;
}
