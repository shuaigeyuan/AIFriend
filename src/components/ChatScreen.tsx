'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Moon, Sun } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { getCharacterStyle } from '@/data/characterStyles';

interface ChatScreenProps {
  onBack: () => void;
}

export function ChatScreen({ onBack }: ChatScreenProps) {
  const { chatState, sendMessage, resetChat } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages, chatState.isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    sendMessage(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBack = () => {
    resetChat();
    onBack();
  };

  if (!chatState.character) return null;

  const character = chatState.character;
  const style = getCharacterStyle(character.id);
  
  // 判断是否为深色主题
  const isDark = ['cool-guy', 'artsy'].includes(character.id);

  return (
    <div className={`min-h-screen flex flex-col max-w-[600px] mx-auto bg-gradient-to-br ${style.bgGradient}`}>
      {/* 顶部栏 */}
      <div className={`${style.headerBg} px-4 py-3 flex items-center gap-3 sticky top-0 z-10 border-b border-black/5`}>
        <button
          onClick={handleBack}
          className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-white/50 text-gray-600'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${style.avatarGradient} flex items-center justify-center shadow-lg`}>
          <span className="text-lg font-bold text-white">{character.name.charAt(0)}</span>
        </div>

        <div className="flex-1">
          <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{character.name}</h2>
          <p className="text-xs flex items-center gap-1">
            <span className={`w-2 h-2 ${style.onlineColor} rounded-full animate-pulse`} />
            <span className={isDark ? 'text-gray-300' : 'text-green-600'}>在线</span>
          </p>
        </div>

        {/* 装饰图标 */}
        <div className="p-2">
          {style.decoration === 'dreamy' ? (
            <Moon className={`w-5 h-5 ${isDark ? 'text-purple-300' : 'text-purple-500'}`} />
          ) : style.decoration === 'bubbly' ? (
            <Sun className="w-5 h-5 text-orange-500" />
          ) : null}
        </div>
      </div>

      {/* 消息列表 */}
      <div className={`flex-1 overflow-y-auto py-4 ${style.chatBg}`}>
        {/* 欢迎提示 */}
        {chatState.messages.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${style.avatarGradient} flex items-center justify-center shadow-lg`}>
              <span className="text-3xl font-bold text-white">{character.name.charAt(0)}</span>
            </div>
            <p className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              {getWelcomeMessage(character.id)}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {getHintMessage(character.id)}
            </p>
          </div>
        )}

        {/* 消息气泡 */}
        {chatState.messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            characterName={character.name}
            style={style}
            isDark={isDark}
          />
        ))}

        {/* 正在输入提示 */}
        {chatState.isTyping && <TypingIndicator name={character.name} style={style} isDark={isDark} />}

        <div ref={messagesEndRef} />
      </div>

      {/* 图片加载提示 */}
      {chatState.isGeneratingImage && (
        <div className={`px-4 py-2 flex items-center gap-2 ${isDark ? 'bg-purple-900/50 text-purple-200' : 'bg-amber-50 text-amber-600'}`}>
          <ImageIcon className="w-4 h-4" />
          {character.name}正在发照片...
        </div>
      )}

      {/* 输入框 */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-t border-black/10 p-3`}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`给${character.name}发消息...`}
            className={`flex-1 px-4 py-3 rounded-2xl resize-none focus:outline-none focus:ring-2 transition-all ${style.inputBg} ${isDark ? 'text-white placeholder-gray-500 focus:ring-purple-500' : 'text-gray-800 placeholder-gray-400 focus:ring-pink-300'}`}
            rows={1}
            disabled={chatState.isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chatState.isTyping}
            className={`p-3 ${style.sendBtnColor} text-white rounded-full hover:${style.sendBtnHover} transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// 根据角色返回欢迎消息
function getWelcomeMessage(characterId: string): string {
  const messages: Record<string, string> = {
    'warm-boy': '嗨～我是林屿',
    'cool-guy': '有事？',
    'sunshine': '嘿！我是苏晨，快来聊天呀～',
    'artsy': '深夜了，想听听音乐吗？',
  };
  return messages[characterId] || '你好～';
}

// 根据角色返回提示消息
function getHintMessage(characterId: string): string {
  const hints: Record<string, string> = {
    'warm-boy': '我会一直在你身边的～',
    'cool-guy': '别废话，有话直说',
    'sunshine': '今天也要元气满满哦！☀️',
    'artsy': '让我为你写一首歌吧～',
  };
  return hints[characterId] || '发送消息开始聊天吧～';
}