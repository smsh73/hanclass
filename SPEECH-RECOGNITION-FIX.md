# Speech Recognition 네트워크 오류 수정

## 문제
- Speech Recognition API에서 "network" 오류 발생
- 오류 발생 시 사용자에게 알림 없음
- 네트워크 오류 시 무한 재시도 시도

## 수정 사항

### 1. 오류 타입별 처리 개선 (`frontend/lib/voice.ts`)

#### 네트워크 오류 처리
- `network` 오류 시 자동 재시도 방지
- 사용자에게 경고 메시지 표시

#### 기타 오류 처리
- `no-speech`: 정상적인 무음 상태, 재시도 가능
- `aborted`: 사용자 중단, 재시도하지 않음
- `not-allowed`: 마이크 권한 없음, 경고 표시
- `service-not-allowed`: Speech Recognition 서비스 비활성화

### 2. 재시도 로직 개선
- 네트워크 오류는 재시도하지 않음
- 일시적인 오류는 짧은 지연 후 재시도
- `onend` 핸들러에서 재시도 로직 개선

### 3. 사용자 피드백 개선 (`frontend/components/VoiceRecorder.tsx`)
- 오류 상태 표시 추가
- 오류 메시지 표시
- 성공 시 오류 메시지 자동 제거

## 참고 사항

### Speech Recognition 네트워크 오류 원인
1. 브라우저가 Speech Recognition 서비스에 접근할 수 없음
2. 네트워크 연결 문제
3. 브라우저 호환성 문제 (Chrome/Edge 권장)
4. HTTPS가 아닌 환경 (하지만 Azure는 HTTPS이므로 해당 없음)

### 해결 방법
- Chrome 또는 Edge 브라우저 사용 권장
- 마이크 권한 확인
- 네트워크 연결 확인
- 브라우저 재시작
