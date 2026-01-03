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

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // 권한 확인 후 즉시 중지
      setPermissionDenied(false);
      setError(null);
      
      // 권한 허용 후 음성 인식 시작
      if (recognitionRef.current && isEnabled && !isAISpeaking) {
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      } else {
        setError('마이크 접근 중 오류가 발생했습니다.');
      }
    }
  };

  useEffect(() => {
    if (!recognitionRef.current) {
      return;
    }

    if (isEnabled && !isAISpeaking && !permissionDenied) {
      recognitionRef.current.start();
      setIsListening(true);
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isEnabled, isAISpeaking, permissionDenied]);

  return (
    <div className="flex flex-col gap-2">
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
        <div className="flex flex-col gap-2">
          <span className="text-xs text-yellow-600">
            {error}
          </span>
          {permissionDenied && (
            <div className="flex flex-col gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs font-semibold text-yellow-800">마이크 권한 설정 방법:</p>
              <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                <li>주소창 왼쪽의 자물쇠 아이콘을 클릭하세요</li>
                <li>마이크 권한을 "허용"으로 변경하세요</li>
                <li>페이지를 새로고침하세요</li>
              </ul>
              <button
                onClick={requestMicrophonePermission}
                className="mt-2 px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                마이크 권한 다시 요청
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

