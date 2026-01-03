import express, { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/aiService';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { io } from '../index';
import { validateStartConversation, validateConversationMessage } from '../middleware/validate';

const router = express.Router();

/**
 * @swagger
 * /api/conversation/start:
 *   post:
 *     summary: 대화 시작
 *     tags: [Conversation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *                 example: 인사하기
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: beginner
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: 대화 시작 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationResponse'
 */
// Get conversation topics from curriculum
router.get('/topics', async (req: Request, res: Response, next: NextFunction) => {
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
router.post('/start', validateStartConversation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, level, sessionId } = req.body;
    // Validation은 validateStartConversation 미들웨어에서 처리됨

    // sessionId로 사용자 정보 확인 (선택사항)
    if (sessionId) {
      try {
        const userResult = await query('SELECT * FROM users WHERE session_id = $1', [sessionId]);
        if (userResult.rows.length > 0) {
          // 사용자 정보가 있으면 레벨 정보 활용 가능
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
router.post('/message', validateConversationMessage, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, topic, level, conversationHistory } = req.body;
    // Validation은 validateConversationMessage 미들웨어에서 처리됨

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
