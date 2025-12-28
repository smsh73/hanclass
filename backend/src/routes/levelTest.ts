import express from 'express';
import { levelTestService } from '../services/levelTestService';
import { AppError } from '../middleware/errorHandler';

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
router.post('/submit', async (req, res, next) => {
  try {
    const { userId, answers } = req.body;

    if (!userId || !answers || !Array.isArray(answers)) {
      throw new AppError('userId and answers array required', 400);
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

