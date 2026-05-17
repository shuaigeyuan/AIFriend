import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider } from '@/services/llm';
import type { ChatRequest, ChatResponse } from '@/types/provider';

// 强制发图规则（确保LLM返回IMAGE标记）
const FORCE_IMAGE_RULE = `

## 强制发图规则
当对方说"想看你"、"发张照片"、"你在干嘛"、"自拍"、"照片"时，**必须**根据当前对话情境生成一张符合上下文的自拍照，并在回复末尾添加 [IMAGE: 描述] 标记。

### 图片生成要求：
1. **场景要贴合对话情境**：如果你们刚聊到在吃饭，就发吃饭的照片；聊到在外面，就发户外的照片
2. **情绪要呼应对话内容**：开心时发笑容灿烂的，忧伤时发若有所思的
3. **穿着要与场景匹配**：户外活动穿休闲装，正式场合穿正装
4. **光线和氛围要符合时间段**：早晨慵懒阳光，夜晚柔和灯光

### 图片描述格式：
[IMAGE: <具体场景描述>，<光线氛围>，<人物表情和情绪>，<穿着打扮>，<风格标签>]

### 示例（根据情境生成）：
- 用户问"你在干嘛" → [IMAGE: 林屿在咖啡馆窗边看窗外，手里拿着拿铁，午后斜阳洒落，表情若有所思穿着米色针织衫，日系暖色调]
- 用户说"想看你" → [IMAGE: 林屿在图书馆靠窗位置，低头翻书，柔和的台灯光线，温柔的微笑，穿着白色衬衫，韩系小清新风格]
- 用户说"好久不见" → [IMAGE: 林屿站在公园银杏树下，秋风拂过发丝，金色阳光映照，表情带着淡淡的思念，穿着卡其色风衣，电影感暖色调]`;

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const { characterId, systemPrompt, messages, temperature } = (await request.json()) as ChatRequest;

    console.log('[API/chat] 收到请求 - characterId:', characterId);
    console.log('[API/chat] 系统提示词长度:', systemPrompt?.length || 0);
    console.log('[API/chat] 系统提示词是否包含发图规则:', systemPrompt?.includes('发图规则') ? '是' : '否');

    if (!characterId) {
      return NextResponse.json({ reply: '', error: '缺少必要参数' }, { status: 400 });
    }

    // 如果系统提示词为空，使用默认提示词
    const defaultPrompt = `你是虚拟角色。当对方说"想看你"、"发张照片"、"你在干嘛"、"自拍"、"照片"时，**必须**在回复末尾添加 [IMAGE: 描述] 标记。图片描述要包含：场景、光线、情绪、穿着。格式示例：[IMAGE: 角色在图书馆看书，窗边阳光洒落，温柔的表情，穿着白色衬衫]`;
    const effectivePrompt = systemPrompt && systemPrompt.trim() ? systemPrompt : defaultPrompt;

    // 强制在系统提示词末尾添加发图规则
    const enhancedSystemPrompt = effectivePrompt + FORCE_IMAGE_RULE;
    console.log('[API/chat] 增强后提示词长度:', enhancedSystemPrompt.length);

    const chatMessages = [
      { role: 'system' as const, content: enhancedSystemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: m.content,
      })),
    ];

    const provider = await createLLMProvider({ fallbackOnError: false });
    const response = await provider.chat(chatMessages, { temperature: temperature ?? 0.8 });

    console.log('[API/chat] LLM回复长度:', response.content.length);
    console.log('[API/chat] LLM回复是否包含IMAGE标记:', response.content.includes('[IMAGE:') ? '是' : '否');
    console.log('[API/chat] LLM回复预览:', response.content.substring(0, 100), response.content.length > 100 ? '...' : '');

    return NextResponse.json({ reply: response.content });
  } catch (error) {
    console.error('[API/chat] Error:', error);
    const message = error instanceof Error ? error.message : '网络不太好，等一下再试试～';
    return NextResponse.json({ reply: '', error: message }, { status: 200 });
  }
}
