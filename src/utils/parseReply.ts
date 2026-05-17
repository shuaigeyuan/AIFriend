import { ParsedReply } from '@/types/chat';

/**
 * 从LLM回复中解析文字和图片标记
 * @param reply LLM的原始回复
 * @returns 解析后的文字内容和图片描述
 */
export const parseReply = (reply: string): ParsedReply => {
  console.log('[parseReply] 原始回复:', reply.substring(0, 100), reply.length > 100 ? '...' : '');
  
  // 匹配 [IMAGE: 图片描述] 标记
  const imageMatch = reply.match(/\[IMAGE:\s*(.+?)\]/);
  console.log('[parseReply] 图片匹配结果:', imageMatch ? imageMatch[1].substring(0, 50) : 'null');
  
  // 去掉图片标记，得到纯文字内容
  const textContent = reply.replace(/\[IMAGE:\s*.+?\]/g, '').trim();
  
  const result = {
    text: textContent,
    imagePrompt: imageMatch ? imageMatch[1].trim() : null,
  };
  
  console.log('[parseReply] 解析结果:', JSON.stringify(result));
  
  return result;
};
