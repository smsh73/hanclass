'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const requestId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    console.log(`[LOGIN] ${requestId} - Starting login`, {
      username,
      passwordLength: password.length,
      apiUrl: process.env.NEXT_PUBLIC_API_URL
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const duration = Date.now() - startTime;
      console.log(`[LOGIN] ${requestId} - Response received`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${duration}ms`
      });

      let data;
      try {
        data = await response.json();
        console.log(`[LOGIN] ${requestId} - Response data`, {
          success: data.success,
          hasToken: !!data.token,
          hasError: !!data.error,
          errorMessage: data.error?.message
        });
      } catch (parseError) {
        const text = await response.text();
        console.error(`[LOGIN] ${requestId} - Failed to parse response`, {
          status: response.status,
          responseText: text.substring(0, 200)
        });
        setError(`서버 응답 오류 (${response.status}): ${text.substring(0, 100)}`);
        setIsLoading(false);
        return;
      }

      if (response.ok && data.success && data.token) {
        console.log(`[LOGIN] ${requestId} - Login successful`, {
          tokenLength: data.token.length,
          tokenPrefix: data.token.substring(0, 20)
        });
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminToken', data.token);
          console.log(`[LOGIN] ${requestId} - Token saved to localStorage`);
        }
        
        router.push('/admin');
      } else {
        const errorMsg = data.error?.message || data.message || '로그인에 실패했습니다.';
        console.error(`[LOGIN] ${requestId} - Login failed`, {
          success: data.success,
          hasToken: !!data.token,
          error: errorMsg
        });
        setError(errorMsg);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[LOGIN] ${requestId} - Exception occurred`, {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      setError(`로그인 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">관리자 로그인</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            홈으로
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-900">사용자명</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-900">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-500 text-gray-900 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-semibold"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600 text-center">
          기본 계정: admin / Admin@2026
        </p>
      </div>
    </div>
  );
}

