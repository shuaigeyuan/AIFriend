import type { TTSResponse, ProviderError } from '@/types/provider';
import { classifyProviderError, logProviderRequest } from '@/utils/providerError';

export interface TTSProvider {
  name: string;
  synthesize(options: { uid: string; text: string; speaker?: string; audioFormat?: string }): Promise<TTSResponse>;
}

export async function createVolcanoTTSProvider(): Promise<TTSProvider> {
  const apiKey = process.env.VOLCANO_TTS_API_KEY;
  const appId = process.env.VOLCANO_TTS_APP_ID;
  
  // 豆包TTS使用单独的API端点
  const baseUrl = 'https://openspeech.bytedance.com/api/v1/tts';

  if (!apiKey) {
    throw new Error('VOLCANO_TTS_API_KEY is not configured');
  }

  return {
    name: 'volcano-tts',

    async synthesize(options: { uid: string; text: string; speaker?: string; audioFormat?: string }): Promise<TTSResponse> {
      const startTime = Date.now();
      logProviderRequest('tts', 'volcano-tts', 'start');

      try {
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer; ${apiKey}`,
          },
          body: JSON.stringify({
            app: {
              appid: appId || 'default',
              token: apiKey,
              cluster: 'cn-north-1',
            },
            user: {
              uid: options.uid,
            },
            audio: {
              voice_type: options.speaker || 'ICL_zh_female_qingxin_common',
              encoding: options.audioFormat || 'mp3',
              speed_ratio: 1.0,
            },
            request: {
              reqid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: options.text,
              text_type: 'plain',
              operation: 'query',
            },
          }),
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'Unknown error');
          const error = new Error(`Volcano TTS API error: ${response.status} ${response.statusText} - ${errorBody}`) as Error & { status?: number };
          error.status = response.status;
          throw error;
        }

        const data = await response.json() as {
          data: string;
          message?: string;
          code?: number;
        };

        if (!data.data) {
          throw new Error(data.message || 'TTS合成失败，未返回音频数据');
        }

        // 将base64音频数据转换为Blob URL
        const byteCharacters = atob(data.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(blob);

        logProviderRequest('tts', 'volcano-tts', 'end', {
          duration,
          status: response.status,
        });

        return {
          audioUri: audioUrl,
          audioSize: byteArray.length,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        const classified = classifyProviderError(error, 'TTS 合成失败');
        logProviderRequest('tts', 'volcano-tts', 'error', {
          duration,
          errorCode: classified.code,
        });
        throw classified;
      }
    },
  };
}

export type { TTSResponse, ProviderError };
