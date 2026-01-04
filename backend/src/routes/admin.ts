import express from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { query } from '../database/connection';
import { aiService } from '../services/aiService';
import crypto from 'crypto';
import { logger } from '../utils/logger';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// Verify admin token
router.get('/verify', async (req: AuthRequest, res, next) => {
  try {
    res.json({ success: true, user: { id: req.userId, role: 'admin' } });
  } catch (error) {
    next(error);
  }
});

// Get all user sessions
router.get('/sessions', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, session_id, level, created_at, last_activity 
       FROM users 
       ORDER BY last_activity DESC 
       LIMIT 100`
    );
    res.json({ success: true, sessions: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get session details
router.get('/sessions/:sessionId', async (req: AuthRequest, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await query(
      'SELECT * FROM users WHERE session_id = $1',
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }
    
    res.json({ success: true, session: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete session
router.delete('/sessions/:sessionId', async (req: AuthRequest, res, next) => {
  try {
    const { sessionId } = req.params;
    await query('DELETE FROM users WHERE session_id = $1', [sessionId]);
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
});

// Delete all sessions
router.delete('/sessions', async (req: AuthRequest, res, next) => {
  try {
    await query('DELETE FROM users');
    res.json({ success: true, message: 'All sessions deleted' });
  } catch (error) {
    next(error);
  }
});

// Get API keys
router.get('/api-keys', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      'SELECT id, provider, is_primary, is_active, created_at FROM api_keys ORDER BY is_primary DESC, created_at DESC'
    );
    res.json({ success: true, keys: result.rows });
  } catch (error) {
    next(error);
  }
});

// Create API key
router.post('/api-keys', async (req: AuthRequest, res, next) => {
  try {
    const { provider, apiKey, isPrimary } = req.body;

    if (!provider || !apiKey) {
      throw new AppError('Provider and API key are required', 400);
    }

    if (!['openai', 'claude', 'gemini'].includes(provider)) {
      throw new AppError('Invalid provider', 400);
    }

    // Encrypt API key
    const algorithm = 'aes-256-cbc';
    // ENCRYPTION_KEY는 정확히 32바이트여야 함 (aes-256-cbc)
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!';
    
    // 암호화 키를 정확히 32바이트로 만들기
    let key: Buffer;
    const keyBuffer = Buffer.from(encryptionKey, 'utf8');
    
    if (keyBuffer.length === 32) {
      key = keyBuffer;
    } else if (keyBuffer.length < 32) {
      // 32바이트보다 짧으면 0으로 패딩
      key = Buffer.alloc(32);
      keyBuffer.copy(key);
    } else {
      // 32바이트보다 길면 처음 32바이트만 사용
      key = keyBuffer.slice(0, 32);
    }
    
    logger.info('[API KEY] Encrypting API key', {
      provider,
      encryptionKeyLength: encryptionKey.length,
      keyBufferLength: keyBuffer.length,
      finalKeyLength: key.length,
      apiKeyLength: apiKey.length
    });
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const encryptedKey = iv.toString('hex') + ':' + encrypted;
    
    logger.info('[API KEY] Encryption successful', {
      provider,
      encryptedKeyLength: encryptedKey.length
    });

    // If this is primary, unset other primary keys
    if (isPrimary) {
      await query(
        'UPDATE api_keys SET is_primary = false WHERE provider = $1',
        [provider]
      );
    }

    await query(
      `INSERT INTO api_keys (provider, api_key, is_primary, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (provider, is_primary) WHERE is_primary = true DO UPDATE
       SET api_key = $2, is_primary = $3`,
      [provider, encryptedKey, isPrimary || false]
    );

    // Reload AI service configs
    await aiService.reloadConfigs();

    res.json({ success: true });
  } catch (error: any) {
    logger.error('[API KEY] Failed to create API key', {
      provider: req.body.provider,
      error: error.message,
      errorName: error.name,
      stack: error.stack?.substring(0, 200)
    });
    
    if (error.message?.includes('Invalid key length')) {
      next(new AppError(`암호화 키 설정 오류: 키 길이가 올바르지 않습니다. (${error.message})`, 500));
    } else {
      next(error);
    }
  }
});

// Test API key connection
router.get('/api-keys/test', async (req: AuthRequest, res, next) => {
  try {
    const { provider } = req.query;

    if (!provider || !['openai', 'claude', 'gemini'].includes(provider as string)) {
      throw new AppError('Invalid provider', 400);
    }

    const success = await aiService.testConnection(provider as 'openai' | 'claude' | 'gemini');
    res.json({ success });
  } catch (error) {
    next(error);
  }
});

export default router;

