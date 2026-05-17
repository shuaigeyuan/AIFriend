'use client';

import { useState, useEffect } from 'react';

export default function DebugTest() {
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    // 测试前端发送的系统提示词
    const testSystemPrompt = `你是林屿。22岁，大学中文系大四学生。

## 外貌
身高178cm，偏瘦，戴银色细框眼镜，黑色微卷头发，皮肤白净，笑起来很温柔。日常穿白衬衫或浅色针织衫。

## 发图规则
你必须通过 [IMAGE: 描述] 标记来给对方发照片。规则：
1. 当对方说"想看你"、"发张照片"、"你在干嘛"、"自拍"、"照片"时，**必须**在回复末尾添加 [IMAGE: 描述] 标记
2. 图片描述必须包含：身高178cm，偏瘦，戴银色细框眼镜，黑色微卷头发，皮肤白净，笑起来很温柔。日常穿白衬衫或浅色针织衫。
3. 图片描述要包含：场景、光线、情绪、穿着
4. 如果这轮不发图，就不要包含 [IMAGE: ] 标记
5. 图片风格：清新、暖色调、日系风格
6. [IMAGE:] 标记必须单独一行，格式示例：[IMAGE: 林屿在图书馆看书，窗边阳光洒落，温柔的表情，穿着白色衬衫，清新日系风格]`;

    console.log('测试系统提示词长度:', testSystemPrompt.length);
    console.log('测试系统提示词包含发图规则:', testSystemPrompt.includes('发图规则'));

    // 测试解析函数
    const testReply = '今天在图书馆看书呢，窗边阳光很好。（害羞地推了推眼镜）\n[IMAGE: 林屿坐在图书馆窗边，阳光透过玻璃洒在书页上，他微微侧头看向镜头，露出温柔的笑容，穿着干净的白衬衫]';
    const imageMatch = testReply.match(/\[IMAGE:\s*(.+?)\]/);
    console.log('测试解析结果:', imageMatch ? imageMatch[1] : 'null');

    setTestResult(`系统提示词长度: ${testSystemPrompt.length}\n包含发图规则: ${testSystemPrompt.includes('发图规则')}\n测试回复解析: ${imageMatch ? '成功' : '失败'}`);
  }, []);

  const handleTestChat = async () => {
    const testSystemPrompt = `你是林屿。22岁，大学中文系大四学生。

## 外貌
身高178cm，偏瘦，戴银色细框眼镜，黑色微卷头发，皮肤白净，笑起来很温柔。日常穿白衬衫或浅色针织衫。

## 发图规则
你必须通过 [IMAGE: 描述] 标记来给对方发照片。规则：
1. 当对方说"想看你"、"发张照片"、"你在干嘛"、"自拍"、"照片"时，**必须**在回复末尾添加 [IMAGE: 描述] 标记
2. 图片描述必须包含：身高178cm，偏瘦，戴银色细框眼镜，黑色微卷头发，皮肤白净，笑起来很温柔。日常穿白衬衫或浅色针织衫。
3. 图片描述要包含：场景、光线、情绪、穿着
4. 如果这轮不发图，就不要包含 [IMAGE: ] 标记
5. 图片风格：清新、暖色调、日系风格
6. [IMAGE:] 标记必须单独一行，格式示例：[IMAGE: 林屿在图书馆看书，窗边阳光洒落，温柔的表情，穿着白色衬衫，清新日系风格]`;

    console.log('发送测试请求...');
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterId: 'warm-boy',
        systemPrompt: testSystemPrompt,
        messages: [{ role: 'user', content: '想看你' }],
      }),
    });

    const data = await response.json();
    console.log('LLM回复:', data.reply);
    console.log('包含IMAGE标记:', data.reply.includes('[IMAGE:'));

    setTestResult(`LLM回复:\n${data.reply}\n\n包含IMAGE标记: ${data.reply.includes('[IMAGE:')}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Debug Test</h1>
      <button
        onClick={handleTestChat}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg mb-4"
      >
        测试聊天API
      </button>
      <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap">{testResult}</pre>
    </div>
  );
}
