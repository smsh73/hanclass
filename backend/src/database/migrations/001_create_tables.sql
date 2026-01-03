-- Users table (세션 관리)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  level VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL, -- 'openai', 'claude', 'gemini'
  api_key TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Curriculums table
CREATE TABLE IF NOT EXISTS curriculums (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  level VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Curriculum content table
CREATE TABLE IF NOT EXISTS curriculum_content (
  id SERIAL PRIMARY KEY,
  curriculum_id INTEGER REFERENCES curriculums(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- 'topic', 'dialogue', 'vocabulary', etc.
  content_data JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Word games table
CREATE TABLE IF NOT EXISTS word_games (
  id SERIAL PRIMARY KEY,
  curriculum_id INTEGER REFERENCES curriculums(id) ON DELETE CASCADE,
  word VARCHAR(255) NOT NULL,
  difficulty INTEGER NOT NULL, -- 1-10
  level VARCHAR(50) NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Level tests table
CREATE TABLE IF NOT EXISTS level_tests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  level VARCHAR(50) NOT NULL,
  test_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_primary ON api_keys(is_primary);
CREATE INDEX IF NOT EXISTS idx_curriculum_content_curriculum_id ON curriculum_content(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_word_games_level ON word_games(level);
CREATE INDEX IF NOT EXISTS idx_word_games_difficulty ON word_games(difficulty);
CREATE INDEX IF NOT EXISTS idx_level_tests_user_id ON level_tests(user_id);

-- Admin user will be created by initAdmin.ts with password: Admin@2026
-- Do not create admin user here to avoid password hash conflicts

