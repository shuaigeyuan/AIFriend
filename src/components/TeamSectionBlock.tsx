'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TeamMember {
  id: string;
  name: string;
  tagline: string;
  tags: string[];
  avatar: string;
}

interface TeamSectionBlockProps {
  members: TeamMember[];
  onSelect: (member: TeamMember) => void;
}

export function TeamSectionBlock({ members, onSelect }: TeamSectionBlockProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {members.map((member) => (
        <Card
          key={member.id}
          className={`
            relative overflow-hidden cursor-pointer transition-all duration-300
            hover:shadow-xl hover:-translate-y-1
            ${hoveredId === member.id ? 'ring-2 ring-rose-400' : ''}
          `}
          onClick={() => onSelect(member)}
          onMouseEnter={() => setHoveredId(member.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* 渐变背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-pink-50" />
          
          {/* 装饰性光效 */}
          <div 
            className="absolute inset-0 opacity-0 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at ${hoveredId === member.id ? '30% 30%' : '100% 100%'}, rgba(251, 113, 133, 0.15), transparent 50%)`,
              opacity: hoveredId === member.id ? 1 : 0.3,
            }}
          />

          <CardContent className="relative z-10 p-6">
            <div className="flex items-start gap-4">
              {/* 头像 */}
              <div className={`
                relative flex-shrink-0 transition-transform duration-300
                ${hoveredId === member.id ? 'scale-110' : ''}
              `}>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">
                    {member.name.charAt(0)}
                  </span>
                </div>
                {/* 在线状态指示器 */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {member.name}
                  </h3>
                  {hoveredId === member.id && (
                    <span className="text-xs text-rose-500 animate-pulse">
                      点击开始聊天
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {member.tagline}
                </p>
                
                {/* 标签 */}
                <div className="flex flex-wrap gap-2">
                  {member.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`
                        px-2 py-1 text-xs rounded-full transition-all duration-300
                        ${hoveredId === member.id 
                          ? 'bg-rose-100 text-rose-600 scale-105' 
                          : 'bg-gray-100 text-gray-500'
                        }
                      `}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 悬停时显示箭头 */}
            <div className={`
              absolute top-4 right-4 transition-all duration-300
              ${hoveredId === member.id ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
            `}>
              <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </CardContent>

          {/* 底部渐变边框 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-pink-400 to-rose-400" />
        </Card>
      ))}
    </div>
  );
}

export default TeamSectionBlock;