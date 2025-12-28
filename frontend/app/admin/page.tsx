'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  if (isLoading) {
    return <div className="p-8">로딩 중...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">관리자 페이지</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/api-keys"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-4">🔑</div>
            <h3 className="text-xl font-semibold mb-2">API 키 관리</h3>
            <p className="text-gray-600">
              OpenAI, Claude, Gemini API 키를 등록하고 관리하세요
            </p>
          </Link>

          <Link
            href="/admin/curriculum"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">교안 업로드</h3>
            <p className="text-gray-600">
              Word/PDF 파일을 업로드하여 커리큘럼을 생성하세요
            </p>
          </Link>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">통계</h3>
            <p className="text-gray-600">학습 통계를 확인하세요 (준비 중)</p>
          </div>
        </div>
      </main>
    </div>
  );
}

