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
  const requestId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`[SESSION] ${requestId} - Getting user from session`, { sessionId });
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/session/${sessionId}`);
    const duration = Date.now() - startTime;
    
    console.log(`[SESSION] ${requestId} - Response received`, {
      status: response.status,
      ok: response.ok,
      duration: `${duration}ms`
    });
    
    const data = await response.json();
    
    if (data.success && data.user) {
      console.log(`[SESSION] ${requestId} - User found`, {
        userId: data.user.id,
        userName: data.user.name
      });
      return {
        userId: data.user.id,
        userName: data.user.name,
      };
    } else {
      console.warn(`[SESSION] ${requestId} - User not found`, { data });
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[SESSION] ${requestId} - Error`, {
      error: error.message,
      duration: `${duration}ms`
    });
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
