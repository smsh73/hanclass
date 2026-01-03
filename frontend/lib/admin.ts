/**
 * 관리자 인증 및 세션 관리 유틸리티
 */

/**
 * 관리자 로그인 상태 확인
 */
export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const token = localStorage.getItem('adminToken');
  return !!token;
}

/**
 * 관리자 토큰 가져오기
 */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('adminToken');
}

/**
 * 관리자 로그아웃
 */
export function adminLogout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminToken');
  }
}

/**
 * 관리자 토큰 검증 (서버에서)
 */
export async function verifyAdminToken(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.success === true;
    }
    return false;
  } catch (error) {
    console.error('Failed to verify admin token:', error);
    return false;
  }
}
