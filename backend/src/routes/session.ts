import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { validateCreateSession, validateSessionId } from '../middleware/validate';

const router = express.Router();

/**
 * @swagger
 * /api/session/create:
 *   post:
 *     summary: 세션 생성
 *     tags: [Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: 홍길동
 *     responses:
 *       200:
 *         description: 세션 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Create session
router.post('/create', validateCreateSession, async (req, res, next) => {
  try {
    const { name } = req.body;
    // Validation은 validateCreateSession 미들웨어에서 처리됨

    const sessionId = uuidv4();
    const now = new Date();

    await query(
      `INSERT INTO users (name, session_id, created_at, last_activity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id) DO UPDATE
       SET name = $1, last_activity = $4`,
      [name.trim(), sessionId, now, now]
    );

    res.json({
      success: true,
      sessionId,
      name: name.trim(),
    });
  } catch (error) {
    next(error);
  }
});

// Get session
router.get('/:sessionId', validateSessionId, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const result = await query(
      'SELECT * FROM users WHERE session_id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Update activity
router.post('/:sessionId/activity', validateSessionId, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    await query(
      'UPDATE users SET last_activity = $1 WHERE session_id = $2',
      [new Date(), sessionId]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;


