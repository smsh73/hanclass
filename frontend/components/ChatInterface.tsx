'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VoiceRecorder from './VoiceRecorder';
import VoicePlayer from './VoicePlayer';
import { getSessionId } from '@/lib/session';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
  isAIConfigError?: boolean;
}

interface ChatInterfaceProps {
  topic: string;
  level?: string;
  onClose?: () => void;
}

export default function ChatInterface({ topic, level = 'beginner', onClose }: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userTranscript, setUserTranscript] = useState('');
  const sessionId = getSessionId(); // Get session ID

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
    const requestId = `start_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    console.log(`[CONVERSATION START] ${requestId} - Starting`, { topic, level });

    try {
      // 세션에서 userId 가져오기
      const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') : null;
      let userId: number | null = null;
      
      if (sessionId) {
        try {
          console.log(`[CONVERSATION START] ${requestId} - Fetching user from session`, { sessionId });
          const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/session/${sessionId}`);
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            userId = userData.user.id;
            console.log(`[CONVERSATION START] ${requestId} - User found`, { userId });
          }
        } catch (error) {
          console.error(`[CONVERSATION START] ${requestId} - Failed to get user from session:`, error);
        }
      }

      const requestBody = {
        topic,
        level,
        sessionId: sessionId || undefined,
      };

      console.log(`[CONVERSATION START] ${requestId} - Sending request`, {
        url: `${process.env.NEXT_PUBLIC_API_URL}/api/conversation/start`,
        body: requestBody
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const duration = Date.now() - startTime;
      console.log(`[CONVERSATION START] ${requestId} - Response received`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${duration}ms`
      });

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          console.error(`[CONVERSATION START] ${requestId} - Error response`, {
            status: response.status,
            responseText: text.substring(0, 200)
          });
          errorData = JSON.parse(text);
        } catch {
          errorData = { message: '대화 시작에 실패했습니다.' };
        }
        throw new Error(errorData.message || errorData.error?.message || '대화 시작에 실패했습니다.');
      }

      const data = await response.json();
      console.log(`[CONVERSATION START] ${requestId} - Success`, {
        success: data.success,
        hasMessage: !!data.message,
        messageLength: data.message?.length,
        provider: data.provider
      });

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
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[CONVERSATION START] ${requestId} - Exception`, {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      
      let errorMessage = error instanceof Error ? error.message : '대화 시작에 실패했습니다.';
      const isAIConfigError = errorMessage.includes('No AI providers configured') || 
                             errorMessage.includes('AI 서비스가 설정되지 않았습니다');
      
      if (isAIConfigError) {
        errorMessage = 'AI 서비스가 설정되지 않았습니다. 관리자 페이지에서 API 키를 설정해주세요.';
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `오류: ${errorMessage}`,
        timestamp: new Date(),
        isError: true,
        isAIConfigError,
      };
      setMessages([errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isAISpeaking) return;

    const requestId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    console.log(`[CONVERSATION MESSAGE] ${requestId} - Sending message`, {
      text: text.substring(0, 50),
      topic,
      level,
      messageCount: messages.length
    });

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

      const requestBody = {
        message: text,
        topic,
        level,
        conversationHistory,
        sessionId: sessionId || undefined,
      };

      console.log(`[CONVERSATION MESSAGE] ${requestId} - Sending request`, {
        url: `${process.env.NEXT_PUBLIC_API_URL}/api/conversation/message`,
        historyLength: conversationHistory.length
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversation/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const duration = Date.now() - startTime;
      console.log(`[CONVERSATION MESSAGE] ${requestId} - Response received`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${duration}ms`
      });

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          console.error(`[CONVERSATION MESSAGE] ${requestId} - Error response`, {
            status: response.status,
            responseText: text.substring(0, 200)
          });
          errorData = JSON.parse(text);
        } catch {
          errorData = { message: '메시지 전송에 실패했습니다.' };
        }
        throw new Error(errorData.message || errorData.error?.message || '메시지 전송에 실패했습니다.');
      }

      const data = await response.json();
      console.log(`[CONVERSATION MESSAGE] ${requestId} - Success`, {
        success: data.success,
        hasMessage: !!data.message,
        messageLength: data.message?.length,
        provider: data.provider
      });

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
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[CONVERSATION MESSAGE] ${requestId} - Exception`, {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      let errorMessage = error instanceof Error ? error.message : '메시지 전송에 실패했습니다.';
      const isAIConfigError = errorMessage.includes('No AI providers configured') || 
                             errorMessage.includes('AI 서비스가 설정되지 않았습니다');
      
      if (isAIConfigError) {
        errorMessage = 'AI 서비스가 설정되지 않았습니다. 관리자 페이지에서 API 키를 설정해주세요.';
      }
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `오류: ${errorMessage}`,
        timestamp: new Date(),
        isError: true,
        isAIConfigError,
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
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/')}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            홈으로
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          )}
        </div>
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
                  : message.isError
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.isAIConfigError && (
                <div className="mt-3 pt-3 border-t border-red-300">
                  <button
                    onClick={() => router.push('/admin/api-keys')}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-semibold"
                  >
                    관리자 페이지에서 API 키 설정하기
                  </button>
                </div>
              )}
              {message.role === 'assistant' && !message.isError && (
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

