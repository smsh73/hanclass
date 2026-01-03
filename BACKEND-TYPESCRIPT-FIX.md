# 백엔드 TypeScript 빌드 오류 수정

## 문제
- `httpServer.listen()` 호출 시 타입 오류 발생
- `process.env.PORT`가 문자열이므로 숫자로 변환 필요

## 오류 메시지
```
src/index.ts(103,29): error TS2769: No overload matches this call.
  The last overload gave the following error.
    Argument of type 'string' is not assignable to parameter of type 'number'.
src/index.ts(112,29): error TS2769: No overload matches this call.
  The last overload gave the following error.
    Argument of type 'string' is not assignable to parameter of type 'number'.
```

## 수정 사항

### PORT 변수 타입 변환
```typescript
// 수정 전
const PORT = process.env.PORT || 8080;

// 수정 후
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
```

## 설명
- `process.env.PORT`는 항상 문자열 타입
- `httpServer.listen()`의 첫 번째 인자는 숫자 타입이어야 함
- `parseInt()`를 사용하여 문자열을 숫자로 변환
