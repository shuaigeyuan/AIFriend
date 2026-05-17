'use client';

import type { CharacterStyle } from '@/data/characterStyles';

interface TypingIndicatorProps {
  name: string;
  style?: CharacterStyle;
  isDark?: boolean;
}

export function TypingIndicator({ name, style, isDark }: TypingIndicatorProps) {
  // 默认风格
  const defaultStyle: CharacterStyle = {
    bgGradient: 'from-white to-gray-50',
    headerBg: 'bg-white',
    avatarGradient: 'from-pink-300 to-rose-300',
    sendBtnColor: 'bg-pink-400',
    sendBtnHover: 'bg-pink-500',
    inputBg: 'bg-gray-100',
    messageBg: 'bg-white',
    messageTextColor: 'text-gray-800',
    accentColor: 'text-pink-500',
    onlineColor: 'bg-green-400',
    chatBg: 'bg-white',
    glowColor: 'rgba(236, 72, 153, 0.15)',
    fontStyle: 'normal',
    decoration: 'soft',
  };

  const charStyle = style || defaultStyle;

  return (
    <div className="flex items-end gap-2 px-4 py-2">
      {/* 头像 */}
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${charStyle.avatarGradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
        <span className="text-sm font-bold text-white">{name.charAt(0)}</span>
      </div>

      {/* 气泡 */}
      <div className={`rounded-2xl rounded-bl-md px-4 py-3 shadow-sm ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-400'}`} style={{ animationDelay: '0ms' }} />
          <span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-400'}`} style={{ animationDelay: '150ms' }} />
          <span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-400' : 'bg-gray-400'}`} style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{name}正在输入...</span>
    </div>
  );
}