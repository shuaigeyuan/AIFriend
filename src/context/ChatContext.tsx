'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { Character, ChatState, Message } from '@/types/chat';
import { parseReply } from '@/utils/parseReply';

interface ChatContextType {
  chatState: ChatState;
  selectCharacter: (character: Character) => void;
  sendMessage: (content: string) => void;
  resetChat: () => void;
}

const initialState: ChatState = {
  character: null,
  messages: [],
  isTyping: false,
  isGeneratingImage: false,
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chatState, setChatState] = useState<ChatState>(initialState);
  // 防重复请求
  const isGeneratingRef = useRef(false);

  const selectCharacter = useCallback((character: Character) => {
    setChatState((prev) => ({
      ...prev,
      character,
      messages: [],
      isTyping: false,
      isGeneratingImage: false,
    }));
  }, []);

  const resetChat = useCallback(() => {
    setChatState((prev) => ({
      ...prev,
      messages: [],
      isTyping: false,
      isGeneratingImage: false,
    }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    // 防重复请求
    if (isGeneratingRef.current || !chatState.character) return;
    
    // 检查系统提示词是否为空
    if (!chatState.character.systemPrompt || chatState.character.systemPrompt.trim() === '') {
      console.warn('[Chat] 系统提示词为空，使用默认提示词');
      // 设置默认的系统提示词
      const defaultPrompt = `你是${chatState.character.name}。\n\n## 发图规则\n当对方说"想看你"、"发张照片"、"你在干嘛"、"自拍"、"照片"时，**必须**根据当前对话情境生成一张符合上下文的自拍照，并在回复末尾添加 [IMAGE: 描述] 标记。\n\n### 图片生成要求：\n1. **场景要贴合对话情境**：如果你们刚聊到在吃饭，就发吃饭的照片；聊到在外面，就发户外的照片\n2. **情绪要呼应对话内容**：开心时发笑容灿烂的，忧伤时发若有所思的\n3. **穿着要与场景匹配**：户外活动穿休闲装，正式场合穿正装\n4. **光线和氛围要符合时间段**：早晨慵懒阳光，夜晚柔和灯光\n\n### 示例：\n- 用户问"你在干嘛" → [IMAGE: ${chatState.character.name}在咖啡馆窗边，手里拿着咖啡，午后斜阳洒落，若有所思的表情]\n- 用户说"想看你" → [IMAGE: ${chatState.character.name}在图书馆靠窗位置，低头看书，温柔微笑，穿着简单干净]\n- 用户说"好久不见" → [IMAGE: ${chatState.character.name}站在公园银杏树下，秋风拂过发丝，表情带着淡淡的思念]`;
      
      // 更新角色的系统提示词
      setChatState((prev) => ({
        ...prev,
        character: { ...prev.character!, systemPrompt: defaultPrompt },
      }));
    }
    
    isGeneratingRef.current = true;

    try {
      // 1. 添加用户消息
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        type: 'text',
        content,
        timestamp: Date.now(),
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isTyping: true,
      }));

      // 2. 构建对话历史
      const messagesHistory = chatState.messages.map((msg) => ({
        role: msg.role === 'character' ? 'assistant' : 'user',
        content: msg.content,
      }));

      // 3. 调用LLM
      console.log('[Chat] 系统提示词预览:', chatState.character.systemPrompt.substring(0, 150), '...');
      console.log('[Chat] 发送消息:', content);
      
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: chatState.character.id,
          systemPrompt: chatState.character.systemPrompt,
          messages: messagesHistory,
        }),
      });

      // 检查响应状态
      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        console.error('[Chat] API Error:', chatResponse.status, errorText);
        throw new Error(`API 请求失败: ${chatResponse.status}`);
      }

      // 安全解析 JSON
      const responseText = await chatResponse.text();
      let chatResult;
      try {
        chatResult = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[Chat] JSON Parse Error:', parseError, 'Response:', responseText);
        throw new Error('服务返回格式错误');
      }
      
      const { reply, error: apiError } = chatResult;
      
      console.log('[Chat] LLM回复:', reply);
      
      if (apiError) {
        throw new Error(apiError);
      }

      // 4. 解析回复
      const { text: textContent, imagePrompt } = parseReply(reply);
      console.log('[Chat] 解析结果 - 文字:', textContent.substring(0, 50), '...');
      console.log('[Chat] 解析结果 - 图片提示:', imagePrompt || '无');

      // 5. 添加角色文字消息
      const characterMessage: Message = {
        id: `char-${Date.now()}`,
        role: 'character',
        type: 'text',
        content: textContent,
        timestamp: Date.now(),
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, characterMessage],
        isTyping: false,
      }));

      // 6. 并行处理：生成语音 + 生成图片（如果有）
      const uid = `user-${Date.now()}`;

      // 6.1 生成语音（并行）
      const ttsPromise = fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textContent,
          speaker: chatState.character.speaker,
          uid,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            console.error('[Chat] TTS API Error:', res.status, errorText);
            return null;
          }
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch {
            console.error('[Chat] TTS JSON Parse Error:', text);
            return null;
          }
        })
        .then((data) => {
          if (data && data.audioUri) {
            // 更新消息的音频URL
            setChatState((prev) => ({
              ...prev,
              messages: prev.messages.map((msg) =>
                msg.id === characterMessage.id ? { ...msg, audioUri: data.audioUri } : msg
              ),
            }));
          }
        })
        .catch((err) => {
          console.error('[Chat] TTS Error:', err);
        });

      // 6.2 生成图片（如果有图片提示）
      if (imagePrompt) {
        console.log('[Chat] 开始生成图片 - 原始提示:', imagePrompt);
        setChatState((prev) => ({ ...prev, isGeneratingImage: true }));

        // 增强图片提示，加入角色外貌描述
        const enhancedPrompt = `${chatState.character.appearance}。${imagePrompt}`;
        console.log('[Chat] 增强后提示:', enhancedPrompt);

        fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            uid,
          }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const errorText = await res.text();
              console.error('[Chat] Image API Error:', res.status, errorText);
              return null;
            }
            const text = await res.text();
            try {
              return JSON.parse(text);
            } catch {
              console.error('[Chat] Image JSON Parse Error:', text);
              return null;
            }
          })
          .then((data) => {
            if (data && data.imageUri) {
              // 添加图片消息
              const imageMessage: Message = {
                id: `img-${Date.now()}`,
                role: 'character',
                type: 'image',
                content: imagePrompt,
                imageUri: data.imageUri,
                imagePrompt,
                timestamp: Date.now(),
              };

              setChatState((prev) => ({
                ...prev,
                messages: [...prev.messages, imageMessage],
                isGeneratingImage: false,
              }));
            } else {
              setChatState((prev) => ({ ...prev, isGeneratingImage: false }));
            }
          })
          .catch((err) => {
            console.error('[Chat] Image Error:', err);
            setChatState((prev) => ({ ...prev, isGeneratingImage: false }));
          });
      }

      // 等待TTS完成（不阻塞）
      ttsPromise.catch((err) => {
        console.error('[Chat] TTS Error:', err);
      });
    } catch (error) {
      console.error('[Chat] Error:', error);
      setChatState((prev) => ({
        ...prev,
        isTyping: false,
      }));
    } finally {
      isGeneratingRef.current = false;
    }
  }, [chatState.character, chatState.messages]);

  return (
    <ChatContext.Provider value={{ chatState, selectCharacter, sendMessage, resetChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
