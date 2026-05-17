// 运行此脚本检查前端流程
const http = require('http');

console.log('=== 检查前端流程 ===\n');

// 步骤1: 测试聊天API
console.log('步骤1: 测试聊天API');
const chatPostData = JSON.stringify({
  characterId: 'warm-boy',
  systemPrompt: '你是林屿。22岁，大学中文系大四学生。\n\n## 外貌\n身高178cm，偏瘦，戴银色细框眼镜，黑色微卷头发，皮肤白净，笑起来很温柔。日常穿白衬衫或浅色针织衫。\n\n## 发图规则\n当对方说"想看你"时，必须在回复末尾添加 [IMAGE: 描述] 标记。',
  messages: [{role: 'user', content: '想看你'}]
});

const chatOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(chatPostData)
  }
};

const chatReq = http.request(chatOptions, (chatRes) => {
  let chatData = '';
  chatRes.on('data', (chunk) => { chatData += chunk; });
  chatRes.on('end', () => {
    console.log('聊天API响应:', chatData);
    
    const chatResponse = JSON.parse(chatData);
    const hasImageTag = chatResponse.reply.includes('[IMAGE:');
    
    console.log('\\n步骤2: 解析回复');
    console.log('包含IMAGE标记:', hasImageTag);
    
    if (hasImageTag) {
      const imageMatch = chatResponse.reply.match(/\[IMAGE:\s*(.+?)\]/);
      const imagePrompt = imageMatch ? imageMatch[1].trim() : null;
      console.log('解析出的图片提示:', imagePrompt);
      
      console.log('\\n步骤3: 测试图片API');
      const imagePostData = JSON.stringify({
        prompt: imagePrompt,
        uid: 'test-user'
      });
      
      const imageOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/image',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(imagePostData)
        }
      };
      
      const imageReq = http.request(imageOptions, (imageRes) => {
        let imageData = '';
        imageRes.on('data', (chunk) => { imageData += chunk; });
        imageRes.on('end', () => {
          console.log('图片API响应:', imageData);
          
          const imageResponse = JSON.parse(imageData);
          if (imageResponse.imageUri) {
            console.log('\\n✅ 完整流程测试通过!');
            console.log('图片URL:', imageResponse.imageUri.substring(0, 60), '...');
          } else {
            console.log('\\n❌ 图片API失败:', imageResponse.error);
          }
        });
      });
      
      imageReq.write(imagePostData);
      imageReq.end();
    } else {
      console.log('\\n❌ LLM没有返回IMAGE标记');
      console.log('问题可能在于前端发送的系统提示词不正确');
    }
  });
});

chatReq.write(chatPostData);
chatReq.end();
