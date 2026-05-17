import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider } from '@/services/llm';
import type { ChatRequest, ChatResponse } from '@/types/provider';

// 强制发图规则（确保LLM返回IMAGE标记）
const FORCE_IMAGE_RULE = `

## ⚠️ 强制规则 - 必须遵守！
**当检测到用户消息中包含以下任何关键词时，无论回复内容是什么，都必须在回复末尾添加 [IMAGE: 描述] 标记！**

### 触发关键词列表（包含但不限于）：
- 想看你、我想看你、给我看看、show me
- 发张照片、照片、自拍、发张自拍、自拍一张
- 你在干嘛、在干嘛、在忙什么、做什么呢
- 发图、发张图、图片、pic、picture、photo
- 看看你、让我看看、能看看你吗、发来看看

### 图片描述格式要求（必须严格遵守）：
**格式：[IMAGE: <场景>，<光线>，<情绪>，<穿着>]**

### 图片生成要求：
1. **场景要贴合对话情境**：如果你们刚聊到在吃饭，就发吃饭的照片；聊到在外面，就发户外的照片
2. **情绪要呼应对话内容**：开心时发笑容灿烂的，忧伤时发若有所思的
3. **穿着要与场景匹配**：户外活动穿休闲装，正式场合穿正装
4. **光线和氛围要符合时间段**：早晨慵懒阳光，夜晚柔和灯光

### 示例（必须按照此格式输出）：
- 用户说"想看你" → [IMAGE: 林屿在图书馆靠窗位置，柔和的台灯光线，温柔的微笑，穿着白色衬衫]
- 用户说"你在干嘛" → [IMAGE: 林屿在咖啡馆窗边，午后斜阳洒落，若有所思的表情，穿着米色针织衫]
- 用户说"发张自拍" → [IMAGE: 林屿在卧室书桌前，温暖的台灯，略带羞涩的笑容，穿着灰色卫衣]

### ⚠️ 警告：
**如果检测到触发词但未在回复末尾添加 [IMAGE:] 标记，将会被视为回答错误！这是硬性要求，必须遵守！**`;

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

    // 检查用户消息是否包含触发词
    const userMessage = messages[messages.length - 1]?.content || '';
    const imageTriggers = ['想看你', '照片', '自拍', '发张', '图片', 'pic', 'photo', 'picture'];
    const hasTrigger = imageTriggers.some(trigger => userMessage.includes(trigger));
    
    // 如果有触发词但LLM没有输出IMAGE标记，自动补充
    let finalReply = response.content;
    if (hasTrigger && !response.content.includes('[IMAGE:')) {
      console.log('[API/chat] 检测到触发词但LLM未输出IMAGE标记，自动补充');
      // 根据用户消息生成合适的图片描述
      let imageDesc = '';
      if (userMessage.includes('自拍') || userMessage.includes('照片')) {
        imageDesc = `${characterId === 'warm-boy' ? '林屿' : '角色'}在室内窗边，柔和的自然光，温柔的微笑，穿着浅色衬衫`;
      } else if (userMessage.includes('在干嘛') || userMessage.includes('做什么')) {
        imageDesc = `${characterId === 'warm-boy' ? '林屿' : '角色'}在图书馆看书，午后阳光洒落，专注的表情，穿着白色衬衫`;
      } else {
        imageDesc = `${characterId === 'warm-boy' ? '林屿' : '角色'}在咖啡馆，柔和的灯光，淡淡的微笑，穿着休闲装`;
      }
      finalReply = response.content + ` [IMAGE: ${imageDesc}]`;
      console.log('[API/chat] 补充后的回复:', finalReply.substring(0, 150), '...');
    }

    return NextResponse.json({ reply: finalReply });
  } catch (error) {
    console.error('[API/chat] Error:', error);
    const message = error instanceof Error ? error.message : '网络不太好，等一下再试试～';
    return NextResponse.json({ reply: '', error: message }, { status: 200 });
  }
}
