import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AppError } from './errorHandler';

/**
 * 일반 API Rate Limiter
 * - 15분에 100회 요청 제한
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100회 요청
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new AppError('Too many requests, please try again later.', 429);
  },
});

/**
 * 인증 관련 Rate Limiter (더 엄격)
 * - 15분에 5회 로그인 시도 제한
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 로그인 시도
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 성공한 요청은 카운트에서 제외
  handler: (req: Request, res: Response) => {
    throw new AppError('Too many login attempts, please try again later.', 429);
  },
});

/**
 * AI API Rate Limiter (비용 절감)
 * - 1시간에 50회 요청 제한
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 50, // 최대 50회 요청
  message: 'AI API rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new AppError('AI API rate limit exceeded, please try again later.', 429);
  },
});
