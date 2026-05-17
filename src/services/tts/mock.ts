import type { TTSRequest, TTSResponse } from '@/types/chat';

export interface TTSProvider {
  name: string;
  synthesize(options: { uid: string; text: string; speaker?: string; audioFormat?: string }): Promise<TTSResponse>;
}

export function createMockTTSProvider(): TTSProvider {
  return {
    name: 'mock',

    async synthesize(options: { uid: string; text: string; speaker?: string; audioFormat?: string }): Promise<TTSResponse> {
      console.log(`[Mock TTS] 合成语音: "${options.text}" (音色: ${options.speaker || '默认'})`);
      
      // 返回一个模拟的音频URL（使用在线语音合成服务作为fallback）
      const encodedText = encodeURIComponent(options.text);
      const mockUrl = `https://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&text=${encodedText}`;
      
      return {
        audioUri: mockUrl,
        audioSize: 10240, // 模拟大小约10KB
      };
    },
  };
}
