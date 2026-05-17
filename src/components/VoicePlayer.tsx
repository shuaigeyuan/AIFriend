'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoicePlayerProps {
  audioUri: string;
  duration?: string;
}

export function VoicePlayer({ audioUri, duration = '1s' }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioUri) return;

    setLoadError(false);
    setIsLoaded(false);

    const audio = new Audio(audioUri);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setIsLoaded(true);
    };

    audio.onerror = () => {
      console.error('[VoicePlayer] Audio load error:', audio.error);
      setLoadError(true);
      setIsLoaded(false);
    };

    audio.onended = () => {
      setIsPlaying(false);
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUri]);

  const togglePlay = () => {
    if (!audioRef.current || !isLoaded) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error('[VoicePlayer] Play error:', err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  if (loadError) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100">
        <span className="text-xs text-gray-400">音频加载失败</span>
      </div>
    );
  }

  return (
    <button
      onClick={togglePlay}
      disabled={!isLoaded}
      className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
        isLoaded ? 'bg-rose-50 hover:bg-rose-100' : 'bg-gray-100 cursor-not-allowed'
      }`}
    >
      {isPlaying ? (
        <Pause className="w-4 h-4 text-rose-500" />
      ) : (
        <Play className={`w-4 h-4 ${isLoaded ? 'text-rose-500' : 'text-gray-400'}`} />
      )}
      <div className="flex items-center gap-0.5 h-4">
        <div className={`w-1 bg-rose-400 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} style={{ height: '40%' }} />
        <div className={`w-1 bg-rose-400 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} style={{ height: '70%', animationDelay: '100ms' }} />
        <div className={`w-1 bg-rose-400 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} style={{ height: '50%', animationDelay: '200ms' }} />
        <div className={`w-1 bg-rose-400 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} style={{ height: '80%', animationDelay: '300ms' }} />
        <div className={`w-1 bg-rose-400 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} style={{ height: '60%', animationDelay: '400ms' }} />
      </div>
      <span className="text-xs text-rose-500">{isLoaded ? duration : '...'}</span>
    </button>
  );
}
