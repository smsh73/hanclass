'use client';

import { useState, useEffect, useRef } from 'react';
import VoiceRecorder from './VoiceRecorder';
import VoicePlayer from './VoicePlayer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  topic: string;
  level?: string;
  onClose?: () => void;
}

export default function ChatInterface({ topic, level = 'beginner', onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userTranscript, setUserTranscript] = useState('');

  useEffect(() => {
    if (conversationStarted) {
      startConversation();
    }
  }, [conversationStarted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      // 세션에서 userId 가져오기
      const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') : null;
      let userId: number | null = null;
      
      if (sessionId) {
        try {
          const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/session/${sessionId}`);
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            userId = userData.user.id;
          }
        } catch (error) {
          console.error('Failed to get user from session:', error);
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          level,
          userId: userId || undefined, // userId가 없으면 undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '대화 시작에 실패했습니다.' }));
        throw new Error(errorData.message || '대화 시작에 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        setMessages([aiMessage]);
      } else {
        throw new Error(data.message || '대화 시작에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      const errorMessage = error instanceof Error ? error.message : '대화 시작에 실패했습니다.';
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `오류: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages([errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isAISpeaking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 현재 메시지를 포함한 전체 대화 히스토리
      const conversationHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversation/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          topic,
          level,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '메시지 전송에 실패했습니다.' }));
        throw new Error(errorData.message || '메시지 전송에 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(data.message || '메시지 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error instanceof Error ? error.message : '메시지 전송에 실패했습니다.';
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `오류: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscript = (text: string, isFinal: boolean) => {
    if (isFinal && !isAISpeaking) {
      setUserTranscript('');
      sendMessage(text);
    } else {
      setUserTranscript(text);
    }
  };

  const handleSilence = () => {
    if (userTranscript.trim() && !isAISpeaking) {
      sendMessage(userTranscript);
      setUserTranscript('');
    }
  };

  const handleAISpeechStart = () => {
    setIsAISpeaking(true);
  };

  const handleAISpeechEnd = () => {
    setIsAISpeaking(false);
  };

  if (!conversationStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">주제: {topic}</h2>
        <p className="text-gray-700 mb-6">AI 선생님과 대화를 시작하세요!</p>
        <button
          onClick={() => setConversationStarted(true)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          대화 시작하기
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            닫기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b p-4 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-900">주제: {topic}</h3>
          <p className="text-sm text-gray-700">레벨: {level}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1 text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.role === 'assistant' && (
                <div className="mt-2">
                  <VoicePlayer
                    text={message.content}
                    onStart={handleAISpeechStart}
                    onEnd={handleAISpeechEnd}
                    autoPlay={false}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-4 py-2 rounded-lg">
              <p className="text-gray-500">생각 중...</p>
            </div>
          </div>
        )}
        {userTranscript && (
          <div className="flex justify-end">
            <div className="bg-blue-300 px-4 py-2 rounded-lg">
              <p className="text-gray-700">{userTranscript}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Input */}
      <div className="border-t p-4 bg-gray-50">
        <VoiceRecorder
          onTranscript={handleTranscript}
          onSilence={handleSilence}
          isEnabled={!isAISpeaking}
          isAISpeaking={isAISpeaking}
        />
        {isAISpeaking && (
          <p className="mt-2 text-sm text-gray-600">AI가 말하는 중입니다...</p>
        )}
      </div>
    </div>
  );
}

