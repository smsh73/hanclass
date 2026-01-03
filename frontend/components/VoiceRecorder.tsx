'use client';

import { useEffect, useRef, useState } from 'react';
import { VoiceRecognition } from '@/lib/voice';

interface VoiceRecorderProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onSilence?: () => void;
  isEnabled: boolean;
  isAISpeaking: boolean;
}

export default function VoiceRecorder({
  onTranscript,
  onSilence,
  isEnabled,
  isAISpeaking,
}: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const recognitionRef = useRef<VoiceRecognition | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const recognition = new VoiceRecognition({
      lang: 'ko-KR',
      continuous: true,
      interimResults: true,
    });

    recognition.onResult((text, isFinal) => {
      if (!isAISpeaking) {
        onTranscript(text, isFinal);
        setError(null); // 성공 시 오류 메시지 제거
      }
    });

    recognition.onSilence(() => {
      if (!isAISpeaking && onSilence) {
        onSilence();
      }
    });

    recognition.onError((errorType, errorMessage) => {
      if (errorType === 'not-allowed') {
        setPermissionDenied(true);
        setError(errorMessage || '마이크 권한이 필요합니다.');
      } else {
        setError(errorMessage || '음성 인식 오류가 발생했습니다.');
      }
      setIsListening(false);
    });

    recognitionRef.current = recognition;

    return () => {
      recognition.destroy();
    };
  }, [onTranscript, onSilence, isAISpeaking]);

  useEffect(() => {
    if (!recognitionRef.current) {
      return;
    }

    if (isEnabled && !isAISpeaking) {
      recognitionRef.current.start();
      setIsListening(true);
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isEnabled, isAISpeaking]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isListening && !isAISpeaking
              ? 'bg-red-500 animate-pulse'
              : 'bg-gray-400'
          }`}
        />
        <span className="text-sm text-gray-600">
          {isAISpeaking
            ? 'AI가 말하는 중입니다...'
            : isListening
            ? '듣는 중...'
            : '대기 중'}
        </span>
      </div>
      {error && (
        <span className="text-xs text-yellow-600">
          {error}
        </span>
      )}
    </div>
  );
}

