// API URL 설정 - 빌드 타임에 결정됨
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 디버깅: 클라이언트 사이드에서 API URL 확인
if (typeof window !== 'undefined') {
  console.log('🔍 API URL:', API_URL);
  console.log('🔍 NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL);
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`[API REQUEST] ${requestId}`, {
    endpoint,
    method: options.method || 'GET',
    url: `${API_URL}${endpoint}`,
    hasBody: !!options.body,
    bodySize: options.body ? JSON.stringify(options.body).length : 0
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`[API REQUEST] ${requestId} - Token found`, { tokenLength: token.length });
  } else {
    console.log(`[API REQUEST] ${requestId} - No token`);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const duration = Date.now() - startTime;
    console.log(`[API RESPONSE] ${requestId}`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${duration}ms`,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Request failed' };
      }
      
      console.error(`[API ERROR] ${requestId}`, {
        status: response.status,
        error: errorData,
        responseText: errorText.substring(0, 200)
      });
      
      // 401 Unauthorized 오류 시 관리자 로그인 페이지로 리다이렉트
      if (response.status === 401 && typeof window !== 'undefined') {
        const isAdminPage = window.location.pathname.startsWith('/admin');
        if (isAdminPage) {
          localStorage.removeItem('adminToken');
          window.location.href = '/admin/login';
          return Promise.reject(new Error('인증이 만료되었습니다. 다시 로그인해주세요.'));
        }
      }
      
      throw new Error(errorData.message || errorData.error?.message || 'Request failed');
    }

    const data = await response.json();
    console.log(`[API SUCCESS] ${requestId}`, {
      dataKeys: Object.keys(data),
      dataSize: JSON.stringify(data).length
    });

    return data;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API EXCEPTION] ${requestId}`, {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    throw error;
  }
}

