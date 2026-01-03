/**
 * 세션 관리 유틸리티
 */

export interface SessionInfo {
  sessionId: string | null;
  userName: string | null;
  userId: number | null;
}

/**
 * 세션 정보 가져오기
 */
export function getSessionInfo(): SessionInfo {
  if (typeof window === 'undefined') {
    return { sessionId: null, userName: null, userId: null };
  }

  return {
    sessionId: sessionStorage.getItem('sessionId'),
    userName: sessionStorage.getItem('userName'),
    userId: null, // userId는 서버에서 조회해야 함
  };
}

/**
 * 세션 ID로 사용자 정보 가져오기 (서버에서)
 */
export async function getUserFromSession(sessionId: string): Promise<{ userId: number | null; userName: string | null }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/session/${sessionId}`);
    const data = await response.json();
    
    if (data.success && data.user) {
      return {
        userId: data.user.id,
        userName: data.user.name,
      };
    }
  } catch (error) {
    console.error('Failed to get user from session:', error);
  }
  
  return { userId: null, userName: null };
}

/**
 * 세션 ID 가져오기
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return sessionStorage.getItem('sessionId');
}

/**
 * 현재 사용자 ID 가져오기 (세션에서)
 */
export async function getCurrentUserId(): Promise<number | null> {
  const sessionInfo = getSessionInfo();
  if (!sessionInfo.sessionId) {
    return null;
  }

  const userInfo = await getUserFromSession(sessionInfo.sessionId);
  return userInfo.userId;
}
