# ACR 인증 구조

## 현재 설정

### GitHub Actions → Azure Container Registry (ACR) 푸시

**인증 방식:**
1. **Azure Login**: Service Principal 사용
   - Service Principal: `hanclass-github-actions`
   - 생성자: `seunglee@live.co.kr` 계정
   - 권한: `contributor` (hanclass-rg 리소스 그룹)

2. **ACR 로그인**: Service Principal 기반
   - `az acr login --name hanclassacr`
   - Service Principal에 `AcrPush` 역할 부여됨

3. **Docker 빌드**: ACR 관리자 계정 사용
   - Service Principal 권한으로 ACR 관리자 자격 증명 접근
   - Docker 빌드 액션에서 사용

### 계정 관계

```
seunglee@live.co.kr (Azure 구독 소유자)
  └─> Service Principal: hanclass-github-actions
       └─> ACR AcrPush 권한
            └─> GitHub Actions에서 ACR 푸시
```

## 보안 개선 사항

### 이전 방식
- ACR 관리자 계정 비밀번호를 GitHub Secrets에 저장
- 직접적인 비밀번호 관리 필요

### 현재 방식
- Service Principal 기반 인증
- `seunglee@live.co.kr` 계정으로 생성된 Service Principal 사용
- 더 안전하고 관리하기 쉬운 방식

## 권한 구조

### Service Principal 권한
1. **Resource Group**: `contributor` (hanclass-rg)
2. **ACR**: `AcrPush` (hanclassacr)

### ACR 관리자 계정
- 계정명: `hanclassacr`
- 활성화됨: `adminUserEnabled: true`
- 용도: Docker 빌드 액션에서 사용

## 확인 방법

### Service Principal 확인
```bash
az ad sp show --id 5483998d-9ecd-4892-8932-881bd8a6ae89
```

### ACR 권한 확인
```bash
az role assignment list \
  --scope /subscriptions/af9330f8-2a2c-4948-b1e6-78d04c0217f7/resourceGroups/hanclass-rg/providers/Microsoft.ContainerRegistry/registries/hanclassacr
```

### ACR 로그인 테스트
```bash
az login --service-principal \
  -u 5483998d-9ecd-4892-8932-881bd8a6ae89 \
  -p <clientSecret> \
  --tenant 4d985748-d428-4ba0-a454-3476828d8aa7

az acr login --name hanclassacr
```

## 결론

**GitHub Actions에서 ACR에 푸시할 때:**
- ✅ `seunglee@live.co.kr` 계정으로 생성된 Service Principal 사용
- ✅ 간접적으로 `seunglee@live.co.kr` 계정 권한 사용
- ✅ 더 안전한 인증 방식

