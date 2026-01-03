'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function CurriculumPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress('파일 업로드 중...');

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/curriculum/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setUploadProgress(`커리큘럼 생성 완료! 생성된 커리큘럼 ID: ${data.curriculumIds.join(', ')}`);
        setFiles([]);
      } else {
        setUploadProgress('업로드 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      setUploadProgress('업로드 실패: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">교안 업로드</h1>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          홈으로
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">파일 업로드</h2>
        <form onSubmit={handleUpload}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Word (.docx) 또는 PDF (.pdf) 파일 선택
            </label>
            <input
              type="file"
              multiple
              accept=".docx,.pdf"
              onChange={handleFileSelect}
              className="w-full px-4 py-2 border rounded-lg"
              disabled={isUploading}
            />
            <p className="mt-2 text-sm text-gray-600">
              여러 파일을 동시에 선택할 수 있습니다. 각 파일은 별도의 커리큘럼으로 생성됩니다.
            </p>
          </div>

          {files.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">선택된 파일:</p>
              <ul className="list-disc list-inside">
                {files.map((file, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={files.length === 0 || isUploading}
            className="px-6 py-2 bg-blue-500 text-gray-900 rounded hover:bg-blue-600 disabled:opacity-50 font-semibold"
          >
            {isUploading ? '업로드 중...' : '업로드 및 커리큘럼 생성'}
          </button>
        </form>

        {uploadProgress && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm">{uploadProgress}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">안내</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Word (.docx) 또는 PDF (.pdf) 파일을 업로드할 수 있습니다.</li>
          <li>여러 파일을 동시에 업로드하면 각각 별도의 커리큘럼으로 생성됩니다.</li>
          <li>AI가 자동으로 문서를 분석하여 커리큘럼을 생성합니다.</li>
          <li>한글 인코딩이 올바르게 처리됩니다.</li>
        </ul>
      </div>
    </div>
  );
}

