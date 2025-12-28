-- 샘플 데이터 생성 스크립트

-- 샘플 커리큘럼 생성
INSERT INTO curriculums (title, description, level) VALUES
('기초 한국어 1', '한국어 기초 회화와 문법', 'beginner'),
('중급 한국어 1', '중급 회화와 문법', 'intermediate'),
('고급 한국어 1', '고급 회화와 문법', 'advanced')
ON CONFLICT DO NOTHING;

-- 샘플 커리큘럼 콘텐츠
INSERT INTO curriculum_content (curriculum_id, content_type, content_data, order_index)
SELECT 
  c.id,
  'topic',
  jsonb_build_object(
    'title', '인사하기',
    'description', '한국어 인사 표현 배우기',
    'vocabulary', ARRAY['안녕하세요', '감사합니다', '죄송합니다', '안녕히 가세요']
  ),
  1
FROM curriculums c
WHERE c.title = '기초 한국어 1'
ON CONFLICT DO NOTHING;

INSERT INTO curriculum_content (curriculum_id, content_type, content_data, order_index)
SELECT 
  c.id,
  'topic',
  jsonb_build_object(
    'title', '음식 주문하기',
    'description', '식당에서 음식 주문하는 방법',
    'vocabulary', ARRAY['주문', '메뉴', '맛있다', '맵다']
  ),
  2
FROM curriculums c
WHERE c.title = '기초 한국어 1'
ON CONFLICT DO NOTHING;

-- 샘플 단어 게임 데이터
INSERT INTO word_games (curriculum_id, word, difficulty, level)
SELECT 
  c.id,
  word,
  difficulty,
  'beginner'
FROM curriculums c
CROSS JOIN (VALUES
  ('안녕', 1),
  ('감사', 1),
  ('사과', 1),
  ('학교', 2),
  ('친구', 2),
  ('가족', 2),
  ('한국', 3),
  ('음식', 3),
  ('여행', 3)
) AS words(word, difficulty)
WHERE c.title = '기초 한국어 1'
ON CONFLICT DO NOTHING;

INSERT INTO word_games (curriculum_id, word, difficulty, level)
SELECT 
  c.id,
  word,
  difficulty,
  'intermediate'
FROM curriculums c
CROSS JOIN (VALUES
  ('인사하다', 4),
  ('주문하다', 4),
  ('이해하다', 4),
  ('설명하다', 5),
  ('추천하다', 5),
  ('방문하다', 5),
  ('대화하다', 6),
  ('학습하다', 6),
  ('연습하다', 6)
) AS words(word, difficulty)
WHERE c.title = '중급 한국어 1'
ON CONFLICT DO NOTHING;

INSERT INTO word_games (curriculum_id, word, difficulty, level)
SELECT 
  c.id,
  word,
  difficulty,
  'advanced'
FROM curriculums c
CROSS JOIN (VALUES
  ('교통수단', 7),
  ('환경보호', 7),
  ('문화차이', 7),
  ('경제발전', 8),
  ('사회문제', 8),
  ('기술혁신', 8),
  ('국제협력', 9),
  ('교육개혁', 9),
  ('미래전망', 9)
) AS words(word, difficulty)
WHERE c.title = '고급 한국어 1'
ON CONFLICT DO NOTHING;

