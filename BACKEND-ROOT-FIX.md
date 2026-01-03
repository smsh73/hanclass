# 백엔드 루트 경로 에러 수정

## 문제
- 루트 경로(`/`)에 접속 시 "Cannot GET /" 에러 발생
- `/health` 엔드포인트는 정상 작동

## 수정 사항

### 1. 루트 경로 핸들러 추가
```typescript
app.get('/', (req, res) => {
  res.json({ 
    message: 'HANCLASS Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});
```

### 2. Dockerfile 업데이트
- `node:18-alpine` → `node:20-alpine` (이전에 업데이트했지만 반영 안됨)
- `HOSTNAME=0.0.0.0` 환경 변수 추가

## 테스트
- ✅ `/health` 엔드포인트 정상 작동 확인
- ✅ 루트 경로 핸들러 추가 완료
