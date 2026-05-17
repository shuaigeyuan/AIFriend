import { getStorageProvider } from './factory';
import type { UploadOptions, UploadResult } from '@/types/storage';

export interface SimpleUploadOptions {
  file: Buffer | Blob | string;
  fileName: string;
  folder?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export async function uploadFile(options: SimpleUploadOptions): Promise<UploadResult> {
  const storage = getStorageProvider();
  const { file, fileName, folder = 'uploads', contentType, metadata } = options;

  const timestamp = Date.now();
  const key = `${folder}/${timestamp}-${fileName}`;

  const uploadOptions: UploadOptions = {
    key,
    body: file,
    contentType,
    metadata,
  };

  return storage.upload(uploadOptions);
}

export async function deleteFile(key: string): Promise<boolean> {
  const storage = getStorageProvider();
  const result = await storage.delete(key);
  return result.success;
}

export function getFileUrl(key: string): string {
  const storage = getStorageProvider();
  return storage.getPublicUrl(key);
}

export async function getSignedFileUrl(key: string, expiresIn = 3600): Promise<string> {
  const storage = getStorageProvider();
  return storage.getSignedUrl(key, expiresIn);
}
