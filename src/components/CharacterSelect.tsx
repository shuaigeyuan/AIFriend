'use client';

import { characters } from '@/data/characters';
import { TeamSectionBlock } from './TeamSectionBlock';
import type { Character } from '@/types/chat';

interface CharacterSelectProps {
  onSelect: (character: Character) => void;
}

export function CharacterSelect({ onSelect }: CharacterSelectProps) {
  const handleSelectMember = (member: { id: string; name: string; tagline: string; tags: string[]; avatar: string }) => {
    const character = characters.find((c) => c.id === member.id);
    if (character) {
      onSelect(character);
    }
  };

  const members = characters.map((char) => ({
    id: char.id,
    name: char.name,
    tagline: char.tagline,
    tags: char.tags,
    avatar: char.avatar,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">纸片人男友</h1>
          <p className="text-gray-600">选择一个虚拟男友，开始聊天吧~</p>
        </div>

        <TeamSectionBlock members={members} onSelect={handleSelectMember} />
      </div>
    </div>
  );
}