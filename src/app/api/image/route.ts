import { NextRequest, NextResponse } from 'next/server';
import { createVolcanoProvider } from '@/services/image/volcano';
import type { ImageRequest, ImageApiResponse } from '@/types/provider';

export async function POST(request: NextRequest): Promise<NextResponse<ImageApiResponse>> {
  try {
    const { prompt, uid } = (await request.json()) as ImageRequest;

    if (!prompt || !uid) {
      return NextResponse.json({ imageUri: '', error: '缺少必要参数' }, { status: 400 });
    }

    const provider = await createVolcanoProvider();
    const response = await provider.generate({
      prompt,
      size: '2K',
      watermark: false,
    });

    if (response.urls.length > 0) {
      return NextResponse.json({ imageUri: response.urls[0] });
    } else {
      return NextResponse.json({ imageUri: '', error: '图像生成失败，未返回有效URL' }, { status: 200 });
    }
  } catch (error) {
    console.error('[API/image] Error:', error);
    const message = error instanceof Error ? error.message : '图像生成失败，请稍后重试～';
    return NextResponse.json({ imageUri: '', error: message }, { status: 200 });
  }
}
