# 프론트엔드-백엔드 API 엔드포인트 매핑 검증

## 전체 API 엔드포인트 목록

### ✅ 세션 관리
| 프론트엔드 | 백엔드 | 메서드 | 상태 |
|-----------|--------|--------|------|
| `/api/session/create` | `/api/session/create` | POST | ✅ 일치 |
| `/api/session/:sessionId` | `/api/session/:sessionId` | GET | ✅ 일치 |

### ✅ 대화 학습
| 프론트엔드 | 백엔드 | 메서드 | 상태 |
|-----------|--------|--------|------|
| `/api/conversation/topics` | `/api/conversation/topics` | GET | ✅ 일치 |
| `/api/conversation/start` | `/api/conversation/start` | POST | ✅ 일치 |
| `/api/conversation/message` | `/api/conversation/message` | POST | ✅ 일치 |

### ✅ 레벨 테스트
| 프론트엔드 | 백엔드 | 메서드 | 상태 |
|-----------|--------|--------|------|
| `/api/level-test/questions` | `/api/level-test/questions` | GET | ✅ 일치 |
| `/api/level-test/submit` | `/api/level-test/submit` | POST | ✅ 일치 |

### ✅ 단어 게임
| 프론트엔드 | 백엔드 | 메서드 | 상태 |
|-----------|--------|--------|------|
| `/api/word-game/words` | `/api/word-game/words` | GET | ✅ 일치 |
| `/api/word-game/check` | `/api/word-game/check` | POST | ✅ 일치 |

### ✅ 관리자
| 프론트엔드 | 백엔드 | 메서드 | 상태 |
|-----------|--------|--------|------|
| `/api/auth/login` | `/api/auth/login` | POST | ✅ 일치 |
| `/api/admin/api-keys` | `/api/admin/api-keys` | GET | ✅ 일치 |
| `/api/admin/api-keys` | `/api/admin/api-keys` | POST | ✅ 일치 |
| `/api/admin/api-keys/test` | `/api/admin/api-keys/test` | GET | ✅ 일치 |
| `/api/curriculum/upload` | `/api/curriculum/upload` | POST | ✅ 일치 |

## 검증 결과: 모든 엔드포인트 일치 ✅
