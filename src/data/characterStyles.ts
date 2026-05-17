import { CharacterId } from '@/types/chat';

export interface CharacterStyle {
  // 主题背景渐变
  bgGradient: string;
  // 顶部栏背景
  headerBg: string;
  // 头像渐变
  avatarGradient: string;
  // 发送按钮颜色
  sendBtnColor: string;
  // 发送按钮hover颜色
  sendBtnHover: string;
  // 输入框背景
  inputBg: string;
  // 消息气泡背景（对方）
  messageBg: string;
  // 消息气泡文字颜色
  messageTextColor: string;
  // 强调色/主题色
  accentColor: string;
  // 在线状态颜色
  onlineColor: string;
  // 聊天背景
  chatBg: string;
  // 发光效果颜色
  glowColor: string;
  // 字体风格描述
  fontStyle: string;
  // 装饰元素
  decoration: 'soft' | 'sharp' | 'bubbly' | 'dreamy';
}

export const characterStyles: Record<CharacterId, CharacterStyle> = {
  // 林屿 - 温柔学长型
  'warm-boy': {
    bgGradient: 'from-pink-50 via-white to-rose-50',
    headerBg: 'bg-gradient-to-r from-pink-100 to-rose-100',
    avatarGradient: 'from-pink-300 to-rose-300',
    sendBtnColor: 'bg-pink-400',
    sendBtnHover: 'bg-pink-500',
    inputBg: 'bg-pink-50',
    messageBg: 'bg-gradient-to-br from-pink-100 to-rose-100',
    messageTextColor: 'text-gray-700',
    accentColor: 'text-pink-500',
    onlineColor: 'bg-green-400',
    chatBg: 'bg-gradient-to-b from-pink-50 to-white',
    glowColor: 'rgba(236, 72, 153, 0.15)',
    fontStyle: '温柔圆润',
    decoration: 'soft',
  },
  // 顾冽 - 高冷总监型
  'cool-guy': {
    bgGradient: 'from-gray-800 via-gray-900 to-slate-900',
    headerBg: 'bg-gradient-to-r from-gray-700 to-gray-800',
    avatarGradient: 'from-slate-400 to-gray-500',
    sendBtnColor: 'bg-slate-500',
    sendBtnHover: 'bg-slate-600',
    inputBg: 'bg-gray-700',
    messageBg: 'bg-gradient-to-br from-gray-600 to-gray-700',
    messageTextColor: 'text-gray-100',
    accentColor: 'text-slate-300',
    onlineColor: 'bg-emerald-400',
    chatBg: 'bg-gradient-to-b from-gray-900 to-gray-800',
    glowColor: 'rgba(100, 116, 139, 0.2)',
    fontStyle: '冷峻简约',
    decoration: 'sharp',
  },
  // 苏晨 - 阳光大男孩
  'sunshine': {
    bgGradient: 'from-yellow-50 via-orange-50 to-amber-50',
    headerBg: 'bg-gradient-to-r from-yellow-100 to-orange-100',
    avatarGradient: 'from-yellow-300 to-orange-300',
    sendBtnColor: 'bg-orange-400',
    sendBtnHover: 'bg-orange-500',
    inputBg: 'bg-yellow-50',
    messageBg: 'bg-gradient-to-br from-yellow-100 to-orange-100',
    messageTextColor: 'text-gray-800',
    accentColor: 'text-orange-500',
    onlineColor: 'bg-green-400',
    chatBg: 'bg-gradient-to-b from-yellow-50 to-white',
    glowColor: 'rgba(251, 146, 60, 0.2)',
    fontStyle: '活泼开朗',
    decoration: 'bubbly',
  },
  // 沈默 - 文艺音乐人
  'artsy': {
    bgGradient: 'from-purple-900 via-indigo-900 to-slate-900',
    headerBg: 'bg-gradient-to-r from-purple-800 to-indigo-800',
    avatarGradient: 'from-purple-400 to-violet-500',
    sendBtnColor: 'bg-purple-500',
    sendBtnHover: 'bg-purple-600',
    inputBg: 'bg-purple-800',
    messageBg: 'bg-gradient-to-br from-purple-700 to-indigo-700',
    messageTextColor: 'text-gray-100',
    accentColor: 'text-purple-300',
    onlineColor: 'bg-purple-400',
    chatBg: 'bg-gradient-to-b from-indigo-950 to-purple-950',
    glowColor: 'rgba(147, 51, 234, 0.2)',
    fontStyle: '文艺浪漫',
    decoration: 'dreamy',
  },
};

export const getCharacterStyle = (id: CharacterId): CharacterStyle => {
  return characterStyles[id] || characterStyles['warm-boy'];
};