'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

function ConversationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [level, setLevel] = useState<string>('beginner');

  useEffect(() => {
    const topicParam = searchParams.get('topic');
    const levelParam = searchParams.get('level');
    
    console.log('[CONVERSATION] useEffect - URL params', {
      topicParam,
      levelParam,
      hasSearchParams: !!searchParams
    });
    
    // URL 파라미터에서 topic이 있으면 바로 대화 시작 (외부 링크 등에서 직접 접근)
    if (topicParam) {
      console.log('[CONVERSATION] Topic from URL param, setting selectedTopic', { topicParam });
      setSelectedTopic(topicParam);
    }
    
    // URL 파라미터에서 level이 있으면 레벨 설정
    if (levelParam) {
      console.log('[CONVERSATION] Level from URL param, setting level', { levelParam });
      setLevel(levelParam);
    }

    // 주제가 URL 파라미터로 지정되지 않은 경우에만 주제 목록 가져오기
    // URL 파라미터로 topic이 있으면 이미 selectedTopic이 설정되므로 fetchTopics 불필요
    if (!topicParam) {
      console.log('[CONVERSATION] No topic in URL, fetching topics');
      fetchTopics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchTopics = async () => {
    const requestId = `fetch_topics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    console.log(`[CONVERSATION] ${requestId} - Fetching topics`, { level });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversation/topics?level=${level}`
      );
      
      const duration = Date.now() - startTime;
      console.log(`[CONVERSATION] ${requestId} - Response received`, {
        status: response.status,
        ok: response.ok,
        duration: `${duration}ms`
      });

      if (!response.ok) {
        throw new Error('주제를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      console.log(`[CONVERSATION] ${requestId} - Topics data`, {
        success: data.success,
        topicCount: data.topics?.length || 0
      });

      if (data.success) {
        setTopics(data.topics || []);
        // 자동으로 주제를 선택하지 않음 - 사용자가 명시적으로 선택해야 함
        // 이렇게 하면 레벨 선택 화면이 항상 표시됨
        console.log(`[CONVERSATION] ${requestId} - Topics loaded`, {
          count: data.topics?.length || 0,
          topics: data.topics
        });
      } else {
        throw new Error(data.message || '주제를 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[CONVERSATION] ${requestId} - Failed to fetch topics`, {
        error: error.message,
        duration: `${duration}ms`
      });
      setTopics([]);
    }
  };

  if (selectedTopic) {
    return (
      <div className="h-screen flex flex-col">
        <ChatInterface
          topic={selectedTopic}
          level={level}
          onClose={() => {
            setSelectedTopic('');
            router.push('/conversation');
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">자유 대화 학습</h1>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          홈으로
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-900">레벨 선택</label>
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            fetchTopics();
          }}
          className="bg-white text-gray-900 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="beginner">초급</option>
          <option value="intermediate">중급</option>
          <option value="advanced">고급</option>
        </select>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">주제 선택</h2>
        {topics.length === 0 ? (
          <p className="text-gray-600">주제를 불러오는 중...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic, index) => (
              <button
                key={index}
                onClick={() => setSelectedTopic(topic)}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-500 text-left"
              >
                <h3 className="font-semibold text-gray-900">{topic}</h3>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConversationContent() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-900">로딩 중...</div>}>
      <ConversationInner />
    </Suspense>
  );
}
