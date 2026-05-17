import { NextRequest, NextResponse } from 'next/server';
import { createTTSProvider } from '@/services/tts';
import type { TTSRequest, TTSResponse } from '@/types/chat';
import { cleanTextForSpeech, isTextValidForSpeech } from '@/utils/cleanText';

export async function POST(request: NextRequest): Promise<NextResponse<TTSResponse>> {
  try {
    const { text, speaker, uid } = (await request.json()) as TTSRequest;

    if (!text || !uid) {
      return NextResponse.json({ audioUri: '', audioSize: 0, error: '缺少必要参数' }, { status: 400 });
    }

    // 清理文本
    const cleanedText = cleanTextForSpeech(text);
    
    // 检查清理后的文本是否有效
    if (!isTextValidForSpeech(text)) {
      return NextResponse.json({ audioUri: '', audioSize: 0, error: '文本无效' }, { status: 400 });
    }

    // 使用 TTS Provider 工厂（支持配置切换）
    const provider = await createTTSProvider({ fallbackOnError: false });
    const response = await provider.synthesize({
      uid,
      text: cleanedText,
      speaker: speaker || 'zh_male_taocheng',
      audioFormat: 'mp3',
    });

    return NextResponse.json({
      audioUri: response.audioUri,
      audioSize: response.audioSize,
    });
  } catch (error) {
    console.error('[API/tts] Error:', error);
    // TTS失败不影响主流程，返回空音频
    return NextResponse.json({ audioUri: '', audioSize: 0, error: String(error) }, { status: 200 });
  }
}
