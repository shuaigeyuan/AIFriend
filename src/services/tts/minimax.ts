import type { TTSResponse, ProviderError } from '@/types/provider';
import { classifyProviderError, logProviderRequest } from '@/utils/providerError';

export interface TTSProvider {
  name: string;
  synthesize(options: { uid: string; text: string; speaker?: string; audioFormat?: string }): Promise<TTSResponse>;
}

const SPEAKER_MAPPING: Record<string, string> = {
  'zh_female_qingxin': 'female-qn-qingxin',
  'zh_male_taocheng': 'male-qn-qingse',
  'default': 'male-qn-qingse',
};

export async function createMinimaxProvider(): Promise<TTSProvider> {
  const apiKey = process.env.MINIMAX_TTS_API_KEY;
  const baseUrl = process.env.MINIMAX_TTS_BASE_URL || 'https://api.minimaxi.com/v1/t2a_v2';
  const model = process.env.MINIMAX_TTS_MODEL || 'speech-2.8-turbo';

  if (!apiKey) {
    throw new Error('MINIMAX_TTS_API_KEY is not configured');
  }

  console.log(`[TTS Minimax] ========== Provider 初始化 ==========`);
  console.log(`[TTS Minimax] API Key: ${apiKey ? '✓ 已配置' : '✗ 未配置'}`);
  console.log(`[TTS Minimax] Base URL: ${baseUrl}`);
  console.log(`[TTS Minimax] Model: ${model}`);
  console.log(`[TTS Minimax] =====================================`);

  return {
    name: 'minimax',

    async synthesize(options: { uid: string; text: string; speaker?: string; audioFormat?: string }): Promise<TTSResponse> {
      const startTime = Date.now();
      const requestId = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`\n[TTS Minimax] ========== 请求开始 [${requestId}] ==========`);
      console.log(`[TTS Minimax] [${requestId}] UID: ${options.uid}`);
      console.log(`[TTS Minimax] [${requestId}] 文本: ${options.text.substring(0, 50)}${options.text.length > 50 ? '...' : ''}`);
      console.log(`[TTS Minimax] [${requestId}] 原始音色: ${options.speaker || 'default'}`);
      console.log(`[TTS Minimax] [${requestId}] 映射音色: ${SPEAKER_MAPPING[options.speaker || 'default'] || 'male-qn-qingse'}`);
      console.log(`[TTS Minimax] [${requestId}] 音频格式: ${options.audioFormat || 'mp3'}`);
      console.log(`[TTS Minimax] [${requestId}] 请求时间: ${new Date().toISOString()}`);
      console.log(`[TTS Minimax] ===========================================\n`);

      logProviderRequest('tts', 'minimax', 'start');

      try {
        const voiceId = SPEAKER_MAPPING[options.speaker || 'default'] || 'male-qn-qingse';
        
        const requestBody = {
          model,
          text: options.text,
          stream: false,
          voice_setting: {
            voice_id: voiceId,
            speed: 1,
            vol: 1,
            pitch: 0,
            emotion: 'happy',
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: options.audioFormat || 'mp3',
            channel: 1,
          },
          pronunciation_dict: {
            tone: [],
          },
          subtitle_enable: false,
        };

        console.log(`[TTS Minimax] [${requestId}] >>> 发送请求`);
        console.log(`[TTS Minimax] [${requestId}] >>> URL: ${baseUrl}`);
        console.log(`[TTS Minimax] [${requestId}] >>> Headers: Authorization: Bearer ${apiKey.substring(0, 8)}...`);
        console.log(`[TTS Minimax] [${requestId}] >>> Body: ${JSON.stringify(requestBody).substring(0, 200)}...`);
      
      const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        const duration = Date.now() - startTime;

        console.log(`[TTS Minimax] [${requestId}] <<< 收到响应`);
        console.log(`[TTS Minimax] [${requestId}] <<< 状态码: ${response.status} ${response.statusText}`);
        console.log(`[TTS Minimax] [${requestId}] <<< 响应时间: ${duration}ms`);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'Unknown error');
          console.error(`[TTS Minimax] [${requestId}] ✗ HTTP 错误: ${response.status} ${response.statusText}`);
          console.error(`[TTS Minimax] [${requestId}] ✗ 错误详情: ${errorBody}`);
          const error = new Error(`Minimax TTS API error: ${response.status} ${response.statusText} - ${errorBody}`) as Error & { status?: number };
          error.status = response.status;
          throw error;
        }

        const data = await response.json() as {
          data: {
            audio: string;
            status: number;
            ced: string;
          };
          extra_info: {
            audio_length: number;
            audio_sample_rate: number;
            audio_size: number;
            bitrate: number;
            word_count: number;
            audio_format: string;
            audio_channel: number;
          };
          trace_id: string;
          base_resp: {
            status_code: number;
            status_msg: string;
          };
        };

        console.log(`[TTS Minimax] [${requestId}] <<< 响应解析成功`);
        console.log(`[TTS Minimax] [${requestId}] <<< Trace ID: ${data.trace_id}`);
        console.log(`[TTS Minimax] [${requestId}] <<< Base Resp: status_code=${data.base_resp.status_code}, status_msg=${data.base_resp.status_msg}`);

        if (data.base_resp.status_code !== 0) {
          console.error(`[TTS Minimax] [${requestId}] ✗ 业务错误: code=${data.base_resp.status_code}, msg=${data.base_resp.status_msg}`);
          throw new Error(`Minimax TTS error: ${data.base_resp.status_msg}`);
        }

        if (!data.data.audio) {
          console.error(`[TTS Minimax] [${requestId}] ✗ 音频数据为空`);
          throw new Error('TTS合成失败，未返回音频数据');
        }

        // base64 音频数据转换为 data URL（跨组件可用）
        const base64Audio = data.data.audio;
        
        // 检查是否是十六进制格式（如果是，需要转换为base64）
        let audioUrl: string;
        if (/^[0-9a-fA-F]+$/.test(base64Audio)) {
          // 十六进制字符串转换为base64
          const bytes = new Uint8Array(base64Audio.length / 2);
          for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(base64Audio.substring(i * 2, i * 2 + 2), 16);
          }
          audioUrl = `data:audio/mp3;base64,${Buffer.from(bytes).toString('base64')}`;
          console.log(`[TTS Minimax] [${requestId}] ✓ 已将十六进制转换为base64`);
        } else {
          audioUrl = `data:audio/mp3;base64,${base64Audio}`;
        }

        console.log(`[TTS Minimax] [${requestId}] ✓ 合成成功`);
        console.log(`[TTS Minimax] [${requestId}] ✓ 音频大小: ${data.extra_info.audio_size} bytes`);
        console.log(`[TTS Minimax] [${requestId}] ✓ 音频长度: ${data.extra_info.audio_length}ms`);
        console.log(`[TTS Minimax] [${requestId}] ✓ 采样率: ${data.extra_info.audio_sample_rate}Hz`);
        console.log(`[TTS Minimax] [${requestId}] ✓ 比特率: ${data.extra_info.bitrate}`);
        console.log(`[TTS Minimax] [${requestId}] ✓ 格式: ${data.extra_info.audio_format}`);
        console.log(`[TTS Minimax] [${requestId}] ✓ 声道: ${data.extra_info.audio_channel}`);
        console.log(`[TTS Minimax] [${requestId}] ✓ 总耗时: ${duration}ms`);
        console.log(`[TTS Minimax] [${requestId}] ✓ audioUrl (base64): ${audioUrl.substring(0, 50)}...`);
        console.log(`[TTS Minimax] ========== 请求完成 [${requestId}] ==========\n`);

        logProviderRequest('tts', 'minimax', 'end', {
          duration,
          status: response.status,
        });

        return {
          audioUri: audioUrl,
          audioSize: data.extra_info.audio_size,
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        const classified = classifyProviderError(error, 'TTS 合成失败');
        
        console.error(`\n[TTS Minimax] [${requestId}] ✗✗✗ 请求失败 ✗✗✗`);
        console.error(`[TTS Minimax] [${requestId}] ✗ 错误代码: ${classified.code}`);
        console.error(`[TTS Minimax] [${requestId}] ✗ 错误信息: ${classified.message}`);
        console.error(`[TTS Minimax] [${requestId}] ✗ 可恢复: ${classified.recoverable}`);
        console.error(`[TTS Minimax] [${requestId}] ✗ 总耗时: ${duration}ms`);
        if (classified.originalError) {
          console.error(`[TTS Minimax] [${requestId}] ✗ 原始错误: ${classified.originalError}`);
        }
        console.error(`[TTS Minimax] [${requestId}] ✗✗✗✗✗✗✗✗✗✗✗✗✗✗\n`);
        
        logProviderRequest('tts', 'minimax', 'error', {
          duration,
          errorCode: classified.code,
        });
        throw classified;
      }
    },
  };
}

export type { TTSResponse, ProviderError };
