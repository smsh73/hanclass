// API URL 설정 확인용 유틸리티
// 빌드 타임과 런타임 모두에서 확인 가능하도록

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 디버깅용: 환경 변수 확인
if (typeof window !== 'undefined') {
  console.log('🔍 Client-side API URL:', API_URL);
  console.log('🔍 process.env.NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
} else {
  console.log('🔍 Server-side API URL:', API_URL);
  console.log('🔍 process.env.NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
}

export default API_URL;
