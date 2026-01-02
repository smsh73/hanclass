import express from 'express';
import { aiService } from '../services/aiService';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { io } from '../index';

const router = express.Router();

// Get conversation topics from curriculum
router.get('/topics', async (req, res, next) => {
  try {
    const { level, curriculumId } = req.query;

    let queryText = `
      SELECT DISTINCT cc.content_data->>'title' as topic
      FROM curriculum_content cc
      JOIN curriculums c ON cc.curriculum_id = c.id
      WHERE cc.content_type = 'topic'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (level) {
      queryText += ` AND c.level = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }

    if (curriculumId) {
      queryText += ` AND c.id = $${paramIndex}`;
      params.push(parseInt(curriculumId as string));
      paramIndex++;
    }

    const result = await query(queryText, params);
      const topics = result.rows.map((row: any) => row.topic).filter(Boolean);

    res.json({ success: true, topics });
  } catch (error) {
    next(error);
  }
});

// Start conversation
router.post('/start', async (req, res, next) => {
  try {
    const { topic, level, userId } = req.body;

    if (!topic) {
      throw new AppError('Topic is required', 400);
    }

    // userId는 선택사항 (없어도 대화 가능)
    if (userId) {
      // userId가 있으면 사용자 정보 확인 (선택사항)
      try {
        const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
          // 사용자가 없어도 대화는 계속 진행
        }
      } catch (error) {
        // 사용자 조회 실패해도 대화는 계속 진행
      }
    }

    const systemPrompt = `당신은 한국어를 가르치는 친절한 AI 선생님입니다. 
학생과 자연스럽고 대화하듯이 한국어를 가르쳐주세요.
학생의 레벨: ${level || 'beginner'}
주제: ${topic}
학생의 답변에 대해 격려하고, 필요시 교정해주세요. 간단하고 이해하기 쉽게 설명해주세요.`;

    const initialMessage = await aiService.chat(
      [
        {
          role: 'user',
          content: `안녕하세요! 오늘은 "${topic}"에 대해 이야기하고 싶어요.`,
        },
      ],
      {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 200,
      }
    );

    res.json({
      success: true,
      message: initialMessage.content,
      provider: initialMessage.provider,
    });
  } catch (error) {
    next(error);
  }
});

// Continue conversation
router.post('/message', async (req, res, next) => {
  try {
    const { message, topic, level, conversationHistory } = req.body;

    if (!message) {
      throw new AppError('Message is required', 400);
    }

    const systemPrompt = `당신은 한국어를 가르치는 친절한 AI 선생님입니다. 
학생과 자연스럽고 대화하듯이 한국어를 가르쳐주세요.
학생의 레벨: ${level || 'beginner'}
주제: ${topic || '일반 대화'}
학생의 답변에 대해 격려하고, 필요시 교정해주세요. 간단하고 이해하기 쉽게 설명해주세요.`;

    const messages = conversationHistory || [];
    messages.push({
      role: 'user',
      content: message,
    });

    const response = await aiService.chat(messages, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 300,
    });

    res.json({
      success: true,
      message: response.content,
      provider: response.provider,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
