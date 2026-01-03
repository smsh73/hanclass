'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  useEffect(() => {
    // 세션에서 이름 불러오기
    const savedName = typeof window !== 'undefined' ? sessionStorage.getItem('userName') : null;
    if (savedName) {
      setUserName(savedName);
      setShowNameInput(false);
    }
  }, []);

  useEffect(() => {
    if (!userName) return;

    // 활동 감지
    const updateActivity = () => {
      setLastActivity(new Date());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousedown', updateActivity);
      window.addEventListener('keypress', updateActivity);
      window.addEventListener('scroll', updateActivity);
    }

    // 타임아웃 체크 (30분)
    const checkTimeout = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - lastActivity.getTime();
      if (diff > 30 * 60 * 1000 && userName) {
        // 30분 무인터랙션 시 로그아웃
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('userName');
          sessionStorage.removeItem('sessionId');
        }
        setUserName('');
        setShowNameInput(true);
        router.push('/');
      }
    }, 60000); // 1분마다 체크

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousedown', updateActivity);
        window.removeEventListener('keypress', updateActivity);
        window.removeEventListener('scroll', updateActivity);
      }
      clearInterval(checkTimeout);
    };
  }, [userName, lastActivity, router]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName }),
      });

      const data = await response.json();
      if (data.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('userName', userName);
          sessionStorage.setItem('sessionId', data.sessionId);
        }
        setShowNameInput(false);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      // 에러가 있어도 로컬 세션은 저장
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('userName', userName);
      }
      setShowNameInput(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('sessionId');
    }
    setUserName('');
    setShowNameInput(true);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">한국어학당</h1>
          {userName && (
            <div className="flex items-center gap-4">
              <span className="text-gray-700">안녕하세요, {userName}님</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                로그아웃
              </button>
        </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {showNameInput ? (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">이름을 입력하세요</h2>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
              >
                시작하기
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-blue-800">한국어를 재미있게 배워보세요!</h2>
              <p className="text-xl text-gray-700">
                AI 선생님과 함께하는 인터랙티브 한국어 학습
              </p>
            </div>

            {/* Learning Menu */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Level Test */}
              <Link
                href="/level-test"
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">레벨 테스트</h3>
                <p className="text-gray-600">
                  초급, 중급, 고급 중 나의 한국어 레벨을 확인해보세요
                </p>
              </Link>

              {/* Conversation Learning */}
              <Link
                href="/conversation"
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">자유 대화 학습</h3>
                <p className="text-gray-600">
                  주제별로 AI 선생님과 자연스럽게 대화하며 한국어를 배워보세요
                </p>
              </Link>

              {/* Word Game */}
              <Link
                href="/word-game"
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">🎮</div>
                <h3 className="text-xl font-semibold mb-2">단어 맞추기 게임</h3>
                <p className="text-gray-600">
                  재미있는 게임으로 한국어 단어를 배우고 연습해보세요
                </p>
              </Link>

              {/* Admin */}
              <Link
                href="/admin/login"
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-gray-300"
              >
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-xl font-semibold mb-2">관리자</h3>
                <p className="text-gray-600">
                  시스템 관리 및 설정을 위한 관리자 페이지입니다
                </p>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

