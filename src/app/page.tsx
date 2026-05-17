'use client';

import { useState } from 'react';
import { ChatProvider, useChat } from '@/context/ChatContext';
import { CharacterSelect } from '@/components/CharacterSelect';
import { ChatScreen } from '@/components/ChatScreen';
import type { Character } from '@/types/chat';

function HomeContent() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const { selectCharacter } = useChat();

  const handleSelectCharacter = (character: Character) => {
    selectCharacter(character);
    setSelectedCharacter(character);
  };

  const handleBack = () => {
    setSelectedCharacter(null);
  };

  if (selectedCharacter) {
    return <ChatScreen onBack={handleBack} />;
  }

  return <CharacterSelect onSelect={handleSelectCharacter} />;
}

export default function Home() {
  return (
    <ChatProvider>
      <HomeContent />
    </ChatProvider>
  );
}
