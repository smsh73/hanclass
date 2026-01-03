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
    
    if (topicParam) {
      setSelectedTopic(topicParam);
    }
    if (levelParam) {
      setLevel(levelParam);
    }

    fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchTopics = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversation/topics?level=${level}`
      );
      
      if (!response.ok) {
        throw new Error('주제를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        setTopics(data.topics || []);
        if (!selectedTopic && data.topics && data.topics.length > 0) {
          setSelectedTopic(data.topics[0]);
        }
      } else {
        throw new Error(data.message || '주제를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
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
