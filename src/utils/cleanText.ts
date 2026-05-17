/**
 * 清理文本用于TTS语音合成
 * 移除各种标记和特殊符号，确保TTS能正常朗读
 * @param text 原始文本
 * @returns 清理后的文本
 */
export const cleanTextForSpeech = (text: string): string => {
  return text
    // 去掉 [IMAGE: ...] 标记
    .replace(/\[IMAGE:\s*.+?\]/g, '')
    // 去掉中文括号内容
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    // 去掉中括号内容
    .replace(/\[[^\]]*\]/g, '')
    // 去掉其他标点符号
    .replace(/[「」『』【】《》]/g, '')
    // 去掉多余空格
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * 检查文本是否为空（清理后）
 * @param text 原始文本
 * @returns 是否可以用于TTS
 */
export const isTextValidForSpeech = (text: string): boolean => {
  const cleaned = cleanTextForSpeech(text);
  return cleaned.length > 0;
};
