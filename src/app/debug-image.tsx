'use client';

import { useState } from 'react';
import { parseReply } from '@/utils/parseReply';

export default function DebugImage() {
  const [result, setResult] = useState('');

  const handleTest = async () => {
    // 模拟后端返回的回复
    const testReply = '（放下书，笑着看向镜头）刚想说要不要给你发消息呢，你就出现啦～今天在图书馆泡了一下午，白衬衫都快沾满阳光的味道了。  \n[IMAGE: 林屿在图书馆窗边看书，午后阳光穿过百叶窗落在他肩头，他偏过头对着镜头温柔地笑，银色镜框反射着细碎的光，微卷的黑发有点乱，白衬衫袖子挽到手肘，清瘦的手指间夹着一支笔。日系清新风格，暖色调。]';
    
    console.log('测试回复:', testReply);
    
    // 测试解析
    const parsed = parseReply(testReply);
    console.log('解析结果:', parsed);
    
    setResult(`原始回复: ${testReply.substring(0, 50)}...\n\n解析结果:\n- 文字: ${parsed.text.substring(0, 50)}...\n- 图片提示: ${parsed.imagePrompt || '无'}\n\n包含IMAGE标记: ${parsed.imagePrompt !== null}`);
    
    // 如果有图片提示，测试调用图片API
    if (parsed.imagePrompt) {
      console.log('开始调用图片API...');
      
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: parsed.imagePrompt,
          uid: 'test-user',
        }),
      });
      
      const data = await response.json();
      console.log('图片API响应:', data);
      
      if (data.imageUri) {
        setResult(prev => prev + `\n\n✅ 图片生成成功!\n图片URL: ${data.imageUri.substring(0, 50)}...`);
      } else {
        setResult(prev => prev + `\n\n❌ 图片生成失败: ${data.error}`);
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">图片生成调试</h1>
      <button
        onClick={handleTest}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg mb-4"
      >
        测试图片生成流程
      </button>
      <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap">{result}</pre>
    </div>
  );
}
