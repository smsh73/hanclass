// 한글학당 애플리케이션 상세 테스트 스크립트

const axios = require('axios');

const BACKEND_URL = 'https://hanclass-backend.azurewebsites.net';
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

function test(name, testFn) {
  testResults.total++;
  return testFn()
    .then(() => {
      console.log(`✅ [PASS] ${name}`);
      testResults.passed++;
    })
    .catch((error) => {
      console.log(`❌ [FAIL] ${name}`);
      console.log(`   Error: ${error.message}`);
      testResults.failed++;
      testResults.errors.push({ name, error: error.message });
    });
}

async function runTests() {
  console.log('==========================================');
  console.log('한글학당 애플리케이션 상세 테스트');
  console.log('==========================================\n');

  // 1. 백엔드 Health Check
  console.log('=== 1. 백엔드 Health Check ===');
  await test('Health Check', async () => {
    const response = await axios.get(`${BACKEND_URL}/health`);
    if (response.data.status !== 'ok') throw new Error('Health check failed');
  });

  // 2. 세션 관리 API
  console.log('\n=== 2. 세션 관리 API ===');
  let sessionId;
  
  await test('세션 생성 - 정상 케이스', async () => {
    const response = await axios.post(`${BACKEND_URL}/api/session/create`, {
      name: '테스트사용자'
    });
    if (!response.data.success || !response.data.sessionId) {
      throw new Error('Session creation failed');
    }
    sessionId = response.data.sessionId;
  });

  await test('세션 생성 - 이름 없음', async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/session/create`, {});
      throw new Error('Should have failed');
    } catch (error) {
      if (error.response?.status !== 400) throw error;
    }
  });

  await test('세션 조회', async () => {
    const response = await axios.get(`${BACKEND_URL}/api/session/${sessionId}`);
    if (!response.data.success || response.data.user.name !== '테스트사용자') {
      throw new Error('Session retrieval failed');
    }
  });

  await test('세션 조회 - 존재하지 않는 세션', async () => {
    try {
      await axios.get(`${BACKEND_URL}/api/session/invalid-session-id`);
      throw new Error('Should have failed');
    } catch (error) {
      if (error.response?.status !== 404) throw error;
    }
  });

  await test('활동 업데이트', async () => {
    const response = await axios.post(`${BACKEND_URL}/api/session/${sessionId}/activity`);
    if (!response.data.success) throw new Error('Activity update failed');
  });

  // 3. 커리큘럼 API
  console.log('\n=== 3. 커리큘럼 API ===');
  
  await test('커리큘럼 목록 조회', async () => {
    const response = await axios.get(`${BACKEND_URL}/api/curriculum`);
    if (!response.data.success || !Array.isArray(response.data.curriculums)) {
      throw new Error('Curriculum list retrieval failed');
    }
  });

  // 4. 대화 학습 API
  console.log('\n=== 4. 대화 학습 API ===');
  
  await test('대화 주제 조회', async () => {
    const response = await axios.get(`${BACKEND_URL}/api/conversation/topics`);
    if (!response.data.success || !Array.isArray(response.data.topics)) {
      throw new Error('Topics retrieval failed');
    }
  });

  // 5. 레벨 테스트 API
  console.log('\n=== 5. 레벨 테스트 API ===');
  
  await test('레벨 테스트 문제 조회 - 초급', async () => {
    const response = await axios.get(`${BACKEND_URL}/api/level-test/questions?level=beginner`);
    if (!response.data.success || !Array.isArray(response.data.questions)) {
      throw new Error('Questions retrieval failed');
    }
  });

  await test('레벨 테스트 문제 조회 - 중급', async () => {
    const response = await axios.get(`${BACKEND_URL}/api/level-test/questions?level=intermediate`);
    if (!response.data.success) throw new Error('Intermediate questions failed');
  });

  await test('레벨 테스트 문제 조회 - 고급', async () => {
    const response = await axios.get(`${BACKEND_URL}/api/level-test/questions?level=advanced`);
    if (!response.data.success) throw new Error('Advanced questions failed');
  });

  // 6. 단어 게임 API
  console.log('\n=== 6. 단어 게임 API ===');
  
  await test('단어 게임 단어 조회', async () => {
    const response = await axios.get(`${BACKEND_URL}/api/word-game/words?level=beginner&limit=5`);
    if (!response.data.success || !Array.isArray(response.data.words)) {
      throw new Error('Words retrieval failed');
    }
  });

  await test('단어 게임 답안 체크 - 정답', async () => {
    const response = await axios.post(`${BACKEND_URL}/api/word-game/check`, {
      word: '안녕',
      userAnswer: '안녕'
    });
    if (!response.data.success || !response.data.correct) {
      throw new Error('Correct answer check failed');
    }
  });

  await test('단어 게임 답안 체크 - 오답', async () => {
    const response = await axios.post(`${BACKEND_URL}/api/word-game/check`, {
      word: '안녕',
      userAnswer: '잘가'
    });
    if (!response.data.success || response.data.correct) {
      throw new Error('Incorrect answer check failed');
    }
  });

  // 7. 인증 API (관리자)
  console.log('\n=== 7. 인증 API ===');
  
  await test('관리자 로그인 - 잘못된 자격증명', async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/login`, {
        username: 'wrong',
        password: 'wrong'
      });
      throw new Error('Should have failed');
    } catch (error) {
      if (error.response?.status !== 401) throw error;
    }
  });

  await test('관리자 로그인 - 필수 필드 없음', async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/login`, {
        username: 'admin'
      });
      throw new Error('Should have failed');
    } catch (error) {
      if (error.response?.status !== 400) throw error;
    }
  });

  // 결과 출력
  console.log('\n==========================================');
  console.log('테스트 결과');
  console.log('==========================================');
  console.log(`총 테스트: ${testResults.total}`);
  console.log(`통과: ${testResults.passed}`);
  console.log(`실패: ${testResults.failed}`);
  console.log(`성공률: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n실패한 테스트:');
    testResults.errors.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runTests().catch(console.error);

