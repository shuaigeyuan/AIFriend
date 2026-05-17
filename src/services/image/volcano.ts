import type { ImageResponse, ProviderError } from '@/types/provider';
import { classifyProviderError, logProviderRequest } from '@/utils/providerError';

export interface ImageProvider {
  name: string;
  generate(options: {
    prompt: string;
    size?: string;
    watermark?: boolean;
  }): Promise<ImageResponse>;
}

export async function createVolcanoProvider(): Promise<ImageProvider> {
  const apiKey = process.env.VOLCANO_IMAGE_API_KEY;
  const baseUrl = process.env.VOLCANO_IMAGE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  const model = process.env.VOLCANO_IMAGE_MODEL || 'doubao-seedream-5-0-260128';

  if (!apiKey) {
    throw new Error('VOLCANO_IMAGE_API_KEY is not configured');
  }

  return {
    name: 'volcano',

    async generate(options: {
      prompt: string;
      size?: string;
      watermark?: boolean;
    }): Promise<ImageResponse> {
      const startTime = Date.now();
      logProviderRequest('image', 'volcano', 'start');

      try {
        const response = await fetch(`${baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            prompt: options.prompt,
            sequential_image_generation: 'disabled',
            response_format: 'url',
            size: options.size || '2K',
            stream: false,
            watermark: options.watermark ?? false,
          }),
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'Unknown error');
          const error = new Error(`Volcano API error: ${response.status} ${response.statusText} - ${errorBody}`) as Error & { status?: number };
          error.status = response.status;
          throw error;
        }

        const data = await response.json() as {
          model: string;
          created: number;
          data: Array<{
            url: string;
            size: string;
          }>;
          usage?: {
            generated_images: number;
            output_tokens: number;
            total_tokens: number;
          };
        };

        const urls = data.data.map((item) => item.url);

        logProviderRequest('image', 'volcano', 'end', {
          duration,
          status: response.status,
          extra: { imageCount: urls.length },
        });

        return {
          urls,
          size: data.data[0]?.size,
          usage: data.usage,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        const classified = classifyProviderError(error, '图像生成失败');
        logProviderRequest('image', 'volcano', 'error', {
          duration,
          errorCode: classified.code,
        });
        throw classified;
      }
    },
  };
}

export type { ImageResponse, ProviderError };
