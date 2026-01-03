import express from 'express';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { validateWordGameCheck } from '../middleware/validate';

const router = express.Router();

// Get words for game
router.get('/words', async (req, res, next) => {
  try {
    const { level, difficulty, limit = 10 } = req.query;

    let queryText = 'SELECT * FROM word_games WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (level) {
      queryText += ` AND level = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }

    if (difficulty) {
      queryText += ` AND difficulty = $${paramIndex}`;
      params.push(parseInt(difficulty as string));
      paramIndex++;
    }

    queryText += ` ORDER BY RANDOM() LIMIT $${paramIndex}`;
    params.push(parseInt(limit as string));

    const result = await query(queryText, params);
    res.json({ success: true, words: result.rows });
  } catch (error) {
    next(error);
  }
});

// Submit word game answer
router.post('/check', validateWordGameCheck, async (req, res, next) => {
  try {
    const { word, userAnswer } = req.body;
    // Validation은 validateWordGameCheck 미들웨어에서 처리됨

    // Simple comparison (can be enhanced with fuzzy matching)
    const isCorrect = word.toLowerCase().trim() === userAnswer.toLowerCase().trim();
    
    res.json({
      success: true,
      correct: isCorrect,
      word,
      userAnswer,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

