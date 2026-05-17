'use client';

import { useState } from 'react';
import type { Message } from '@/types/chat';
import { VoicePlayer } from './VoicePlayer';
import { ImageViewer } from './ImageViewer';
import { Loader2 } from 'lucide-react';
import type { CharacterStyle } from '@/data/characterStyles';

interface MessageBubbleProps {
  message: Message;
  characterName: string;
  style?: CharacterStyle;
  isDark?: boolean;
}

export function MessageBubble({ message, characterName, style, isDark }: MessageBubbleProps) {
  const [showImageViewer, setShowImageViewer] = useState(false);

  const isUser = message.role === 'user';
  
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

  if (message.type === 'image') {
    return (
      <>
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-2`}>
          {!isUser && (
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${charStyle.avatarGradient} flex items-center justify-center mr-2 flex-shrink-0 shadow-md`}>
              <span className="text-sm font-bold text-white">{characterName.charAt(0)}</span>
            </div>
          )}

          <div className="max-w-[240px]">
            <div
              className={`rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-all hover:shadow-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}
              onClick={() => message.imageUri && setShowImageViewer(true)}
            >
              {message.imageUri ? (
                <>
                  <img
                    src={message.imageUri}
                    alt="自拍"
                    className="w-full h-auto object-cover rounded-t-xl"
                  />
                  <div className={`px-3 py-2 ${isDark ? 'bg-gray-800/80' : 'bg-gray-100'} text-xs flex items-center gap-2`}>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-500'}>📸 自拍</span>
                  </div>
                </>
              ) : (
                <div className={`w-48 h-48 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
                  <Loader2 className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'} animate-spin`} />
                </div>
              )}
            </div>
          </div>

          {isUser && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 flex-shrink-0 shadow-md ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
              <span className="text-sm font-bold text-white">我</span>
            </div>
          )}
        </div>

        {showImageViewer && message.imageUri && (
          <ImageViewer imageUri={message.imageUri} onClose={() => setShowImageViewer(false)} />
        )}
      </>
    );
  }

  // 文字消息 + 语音消息
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-2`}>
      {/* 头像 */}
      {!isUser && (
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${charStyle.avatarGradient} flex items-center justify-center mr-2 flex-shrink-0 shadow-md`}>
          <span className="text-sm font-bold text-white">{characterName.charAt(0)}</span>
        </div>
      )}

      {/* 气泡 */}
      <div className="max-w-[70%]">
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm transition-all hover:shadow-md ${
            isUser
              ? isDark 
                ? 'bg-blue-600 text-white rounded-br-md' 
                : 'bg-gradient-to-br from-green-400 to-green-500 text-white rounded-br-md'
              : `${charStyle.messageBg} ${charStyle.messageTextColor} rounded-bl-md`
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* 语音按钮（如果有） */}
        {message.audioUri && (
          <div className={`mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            <VoicePlayer audioUri={message.audioUri} />
          </div>
        )}
      </div>

      {/* 头像 */}
      {isUser && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 flex-shrink-0 shadow-md ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
          <span className="text-sm font-bold text-white">我</span>
        </div>
      )}
    </div>
  );
}