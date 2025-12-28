'use client';

import { useEffect, useRef } from 'react';
import { VoiceSynthesis } from '@/lib/voice';

interface VoicePlayerProps {
  text: string;
  onStart?: () => void;
  onEnd?: () => void;
  autoPlay?: boolean;
}

export default function VoicePlayer({
  text,
  onStart,
  onEnd,
  autoPlay = false,
}: VoicePlayerProps) {
  const synthesisRef = useRef<VoiceSynthesis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const synthesis = new VoiceSynthesis();
    synthesis.onStart(() => {
      if (onStart) onStart();
    });
    synthesis.onEnd(() => {
      if (onEnd) onEnd();
    });

    synthesisRef.current = synthesis;

    return () => {
      synthesis.stop();
    };
  }, [onStart, onEnd]);

  useEffect(() => {
    if (autoPlay && text && synthesisRef.current) {
      synthesisRef.current.speak(text, {
        lang: 'ko-KR',
        rate: 0.9,
        pitch: 1.0,
      });
    }
  }, [text, autoPlay]);

  const speak = () => {
    if (synthesisRef.current && text) {
      synthesisRef.current.speak(text, {
        lang: 'ko-KR',
        rate: 0.9,
        pitch: 1.0,
      });
    }
  };

  const stop = () => {
    if (synthesisRef.current) {
      synthesisRef.current.stop();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={speak}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        🔊 재생
      </button>
      <button
        onClick={stop}
        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        ⏹ 정지
      </button>
    </div>
  );
}

