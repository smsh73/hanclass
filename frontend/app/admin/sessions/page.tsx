'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

interface Session {
  id: number;
  name: string;
  session_id: string;
  level: string | null;
  created_at: string;
  last_activity: string;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkAuth();
    fetchSessions();
    
    // 5초마다 세션 목록 갱신
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      router.push('/admin/login');
    }
  };

  const fetchSessions = async () => {
    try {
      const data = await apiRequest('/api/admin/sessions');
      if (data.success) {
        setSessions(data.sessions || []);
        setError('');
      }
    } catch (error: any) {
      console.error('Failed to fetch sessions:', error);
      setError('세션 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('이 세션을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await apiRequest(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      fetchSessions();
    } catch (error: any) {
      alert('세션 삭제 실패: ' + error.message);
    }
  };

  const handleDeleteAllSessions = async () => {
    if (!confirm('모든 세션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      await apiRequest('/api/admin/sessions', {
        method: 'DELETE',
      });
      fetchSessions();
    } catch (error: any) {
      alert('세션 삭제 실패: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  if (isLoading) {
    return <div className="p-8 text-gray-900">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">세션 관리</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              관리자 홈
            </button>
            <button
              onClick={handleDeleteAllSessions}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              모든 세션 삭제
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              활성 세션 ({sessions.length})
            </h2>
          </div>

          {sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              활성 세션이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      세션 ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      레벨
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성 시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      마지막 활동
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {session.session_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.level || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(session.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(session.last_activity)}
                        <br />
                        <span className="text-xs text-gray-400">
                          ({getTimeAgo(session.last_activity)})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteSession(session.session_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
