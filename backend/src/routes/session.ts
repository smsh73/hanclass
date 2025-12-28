import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Create session
router.post('/create', async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      throw new AppError('Name is required', 400);
    }

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
router.get('/:sessionId', async (req, res, next) => {
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
router.post('/:sessionId/activity', async (req, res, next) => {
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


