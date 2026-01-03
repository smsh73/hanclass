'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

interface APIKey {
  id: number;
  provider: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

export default function APIKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'openai',
    apiKey: '',
    isPrimary: false,
  });
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    checkAuth();
    fetchAPIKeys();
  }, []);

  const checkAuth = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      router.push('/admin/login');
    }
  };

  const fetchAPIKeys = async () => {
    try {
      const data = await apiRequest('/api/admin/api-keys');
      if (data.success) {
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/api-keys', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowAddForm(false);
      setFormData({ provider: 'openai', apiKey: '', isPrimary: false });
      fetchAPIKeys();
    } catch (error: any) {
      alert('API 키 등록 실패: ' + error.message);
    }
  };

  const handleTest = async (provider: string) => {
    try {
      const data = await apiRequest(`/api/admin/api-keys/test?provider=${provider}`);
      setTestResult(`${provider}: ${data.success ? '연결 성공' : '연결 실패'}`);
    } catch (error: any) {
      setTestResult(`${provider}: 연결 실패 - ${error.message}`);
    }
  };

  if (isLoading) {
    return <div className="p-8">로딩 중...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">API 키 관리</h1>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          홈으로
        </button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showAddForm ? '취소' : 'API 키 추가'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">새 API 키 등록</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Provider</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="openai">OpenAI</option>
                <option value="claude">Claude (Anthropic)</option>
                <option value="gemini">Gemini (Google)</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">API Key</label>
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="mr-2"
                />
                Primary API로 설정
              </label>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              등록
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Primary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {apiKeys.map((key) => (
              <tr key={key.id}>
                <td className="px-6 py-4 whitespace-nowrap">{key.provider}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {key.is_primary ? '✓' : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {key.is_active ? '✓' : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleTest(key.provider)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    테스트
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {testResult && (
          <div className="p-4 bg-gray-50">
            <p className="text-sm">{testResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}

