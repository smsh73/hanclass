import express from 'express';
import { levelTestService } from '../services/levelTestService';
import { AppError } from '../middleware/errorHandler';
import { validateLevelTestSubmit } from '../middleware/validate';
import { query } from '../database/connection';

const router = express.Router();

// Get test questions
router.get('/questions', async (req, res, next) => {
  try {
    const { level } = req.query;
    const questions = levelTestService.getQuestions(
      level as 'beginner' | 'intermediate' | 'advanced' | undefined
    );
    res.json({ success: true, questions });
  } catch (error) {
    next(error);
  }
});

// Submit test answers
router.post('/submit', validateLevelTestSubmit, async (req, res, next) => {
  try {
    const { sessionId, answers } = req.body;
    // Validation은 validateLevelTestSubmit 미들웨어에서 처리됨

    // sessionId로 userId 조회
    let userId: number | null = null;
    if (sessionId) {
      try {
        const userResult = await query('SELECT id FROM users WHERE session_id = $1', [sessionId]);
        if (userResult.rows.length > 0) {
          userId = userResult.rows[0].id;
        }
      } catch (error) {
        // 사용자 조회 실패해도 테스트는 진행 (익명 사용자)
      }
    }

    const result = await levelTestService.evaluateTest(userId, answers);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

// Get test result
router.get('/result/:userId', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const result = await levelTestService.getTestResult(userId);
    if (!result) {
      throw new AppError('Test result not found', 404);
    }

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

export default router;

