import express, { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/aiService';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { io } from '../index';
import { validateStartConversation, validateConversationMessage } from '../middleware/validate';
import { logger } from '../utils/logger';

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
  const requestId = `conv_start_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  const { logger } = await import('../utils/logger');
  
  try {
    logger.info('[CONVERSATION START]', {
      requestId,
      body: req.body,
      topic: req.body.topic,
      level: req.body.level,
      hasSessionId: !!req.body.sessionId
    });

    const { topic, level, sessionId } = req.body;
    // Validation은 validateStartConversation 미들웨어에서 처리됨

    // sessionId로 사용자 정보 확인 (선택사항)
    if (sessionId) {
      try {
        logger.info('[CONVERSATION START]', { requestId, action: 'Checking user session', sessionId });
        const userResult = await query('SELECT * FROM users WHERE session_id = $1', [sessionId]);
        if (userResult.rows.length > 0) {
          logger.info('[CONVERSATION START]', { requestId, action: 'User found', userId: userResult.rows[0].id });
          // 사용자 정보가 있으면 레벨 정보 활용 가능
        }
      } catch (error: any) {
        logger.warn('[CONVERSATION START]', { requestId, action: 'User session check failed', error: error.message });
        // 사용자 조회 실패해도 대화는 계속 진행
      }
    }

    const systemPrompt = `당신은 한국어를 가르치는 친절한 AI 선생님입니다. 
학생과 자연스럽고 대화하듯이 한국어를 가르쳐주세요.
학생의 레벨: ${level || 'beginner'}
주제: ${topic}
학생의 답변에 대해 격려하고, 필요시 교정해주세요. 간단하고 이해하기 쉽게 설명해주세요.`;

    logger.info('[CONVERSATION START]', {
      requestId,
      action: 'Calling AI service',
      topic,
      level: level || 'beginner',
      systemPromptLength: systemPrompt.length
    });

    // AI 서비스 사용 가능 여부 확인
    try {
      const aiStartTime = Date.now();
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
      const aiDuration = Date.now() - aiStartTime;

    logger.info('[CONVERSATION START]', {
      requestId,
      action: 'AI service completed',
      duration: `${aiDuration}ms`,
      provider: initialMessage.provider,
      messageLength: initialMessage.content.length
    });

    const totalDuration = Date.now() - startTime;
    logger.info('[CONVERSATION START]', {
      requestId,
      action: 'Success',
      totalDuration: `${totalDuration}ms`
    });

    res.json({
      success: true,
      message: initialMessage.content,
      provider: initialMessage.provider,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('[CONVERSATION START]', {
      requestId,
      action: 'Error',
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack?.substring(0, 500),
      topic: req.body.topic,
      level: req.body.level
    });
    next(error);
  }
});

// Continue conversation
router.post('/message', validateConversationMessage, async (req: Request, res: Response, next: NextFunction) => {
  const requestId = `conv_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  const { logger } = await import('../utils/logger');
  
  try {
    logger.info('[CONVERSATION MESSAGE]', {
      requestId,
      messageLength: req.body.message?.length,
      topic: req.body.topic,
      level: req.body.level,
      historyLength: req.body.conversationHistory?.length || 0
    });

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

    logger.info('[CONVERSATION MESSAGE]', {
      requestId,
      action: 'Calling AI service',
      messageCount: messages.length,
      lastMessage: message.substring(0, 50)
    });

    // AI 서비스 사용 가능 여부 확인
    try {
      const aiStartTime = Date.now();
      const response = await aiService.chat(messages, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 300,
      });
      const aiDuration = Date.now() - aiStartTime;

      logger.info('[CONVERSATION MESSAGE]', {
        requestId,
        action: 'AI service completed',
        duration: `${aiDuration}ms`,
        provider: response.provider,
        responseLength: response.content.length
      });

      const totalDuration = Date.now() - startTime;
      logger.info('[CONVERSATION MESSAGE]', {
        requestId,
        action: 'Success',
        totalDuration: `${totalDuration}ms`
      });

      res.json({
        success: true,
        message: response.content,
        provider: response.provider,
      });
    } catch (aiError: any) {
      const aiDuration = Date.now() - aiStartTime;
      logger.error('[CONVERSATION MESSAGE]', {
        requestId,
        action: 'AI service error',
        duration: `${aiDuration}ms`,
        error: aiError.message,
        stack: aiError.stack?.substring(0, 500)
      });
      
      // AI 서비스 오류를 사용자 친화적인 메시지로 변환
      if (aiError.message.includes('No AI providers configured') || 
          aiError.message.includes('All AI providers failed')) {
        throw new AppError('AI 서비스가 설정되지 않았습니다. 관리자 페이지에서 API 키를 설정해주세요.', 503);
      }
      throw aiError;
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('[CONVERSATION MESSAGE]', {
      requestId,
      action: 'Error',
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack?.substring(0, 500),
      message: req.body.message?.substring(0, 50)
    });
    next(error);
  }
});

export default router;
