import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'hanclass',
  user: process.env.DB_USER || 'hanclass',
  password: process.env.DB_PASSWORD || 'hanclass123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_HOST?.includes('azure.com') ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, error });
    throw error;
  }
}

export async function initDatabase() {
  try {
    // Test connection
    const result = await query('SELECT NOW()');
    logger.info('Database connection successful', { time: result.rows[0].now });
    
    // Run migrations
    await runMigrations();
    
    // Initialize admin user
    const { initAdminUser } = await import('./initAdmin');
    await initAdminUser();
  } catch (error) {
    logger.error('Database initialization failed', error);
    throw error;
  }
}

async function runMigrations() {
  const migrationFiles = [
    '001_create_tables.sql',
  ];

  for (const file of migrationFiles) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      // Try multiple possible paths (including dist paths for production)
      const possiblePaths = [
        path.join(__dirname, '../../database/migrations', file),
        path.join(__dirname, '../database/migrations', file),
        path.join(__dirname, 'migrations', file),
        path.join(process.cwd(), 'database/migrations', file),
        path.join(process.cwd(), 'src/database/migrations', file),
        path.join(process.cwd(), 'dist/database/migrations', file),
        path.join('/app', 'database/migrations', file),
        path.join('/app', 'src/database/migrations', file),
        path.join('/app', 'dist/database/migrations', file),
      ];
      
      let migrationSQL = null;
      for (const migrationPath of possiblePaths) {
        try {
          migrationSQL = await fs.readFile(migrationPath, 'utf-8');
          logger.info(`Found migration file at: ${migrationPath}`);
          break;
        } catch (e: any) {
          if (e.code === 'ENOENT') continue;
          throw e;
        }
      }
      
      if (!migrationSQL) {
        logger.warn(`Migration file not found: ${file}, skipping...`);
        // Try to run inline SQL as fallback
        migrationSQL = getInlineMigrationSQL();
        if (migrationSQL) {
          logger.info('Using inline migration SQL');
        } else {
          continue;
        }
      }
      
      await query(migrationSQL);
      logger.info(`Migration completed: ${file}`);
    } catch (error: any) {
      logger.error(`Migration failed: ${file}`, error);
      // Don't throw, just log - tables might already exist
    }
  }
}

function getInlineMigrationSQL(): string | null {
  // Inline migration SQL as fallback
  return `-- Users table (세션 관리)
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
  provider VARCHAR(50) NOT NULL,
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
  content_type VARCHAR(50) NOT NULL,
  content_data JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Word games table
CREATE TABLE IF NOT EXISTS word_games (
  id SERIAL PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  difficulty INTEGER NOT NULL,
  level VARCHAR(50) NOT NULL,
  curriculum_id INTEGER REFERENCES curriculums(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_curriculum_content_curriculum_id ON curriculum_content(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_word_games_difficulty ON word_games(difficulty);
CREATE INDEX IF NOT EXISTS idx_word_games_level ON word_games(level);
CREATE INDEX IF NOT EXISTS idx_level_tests_user_id ON level_tests(user_id);`;
}

export { pool };

