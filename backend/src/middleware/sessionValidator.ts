import { Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * 세션 검증 미들웨어
 * - sessionId가 유효한지 확인
 * - 세션 만료 시간 확인 (30분)
 * - last_activity 업데이트
 */
export async function validateSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionId = req.body.sessionId || req.params.sessionId || req.query.sessionId;

    if (!sessionId) {
      // sessionId가 없어도 일부 엔드포인트는 허용 (예: 익명 사용자)
      return next();
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      throw new AppError('Invalid session ID format', 400);
    }

    // 세션 조회
    const result = await query(
      'SELECT * FROM users WHERE session_id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    const user = result.rows[0];
    const now = new Date();
    const lastActivity = new Date(user.last_activity);
    const sessionTimeout = 30 * 60 * 1000; // 30분

    // 세션 만료 확인
    if (now.getTime() - lastActivity.getTime() > sessionTimeout) {
      // 만료된 세션 삭제
      await query('DELETE FROM users WHERE session_id = $1', [sessionId]);
      throw new AppError('Session expired', 401);
    }

    // last_activity 업데이트
    await query(
      'UPDATE users SET last_activity = $1 WHERE session_id = $2',
      [now, sessionId]
    );

    // 요청 객체에 사용자 정보 추가
    (req as any).user = user;
    (req as any).sessionId = sessionId;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Session validation error', error);
      next(new AppError('Session validation failed', 500));
    }
  }
}

/**
 * 세션 필수 검증 미들웨어
 * - sessionId가 반드시 있어야 함
 */
export function requireSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionId = req.body.sessionId || req.params.sessionId || req.query.sessionId;

  if (!sessionId) {
    throw new AppError('Session ID is required', 400);
  }

  validateSession(req, res, next);
}
