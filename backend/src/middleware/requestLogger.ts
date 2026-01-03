import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * 요청/응답 로깅 미들웨어
 * 모든 API 요청과 응답을 상세히 로깅합니다.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  // 요청 정보 로깅
  logger.info('[REQUEST]', {
    requestId,
    method: req.method,
    path: req.path,
    url: req.url,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Bearer ***' : undefined,
      'origin': req.headers['origin'],
      'referer': req.headers['referer']
    },
    body: req.body && Object.keys(req.body).length > 0 ? {
      ...req.body,
      // 민감한 정보 마스킹
      password: req.body.password ? '***' : undefined,
      apiKey: req.body.apiKey ? '***' : undefined,
    } : undefined,
    ip: req.ip || req.connection.remoteAddress
  });

  // 응답 완료 시 로깅
  const originalSend = res.send;
  res.send = function(body: any) {
    const duration = Date.now() - startTime;
    
    logger.info('[RESPONSE]', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: body ? JSON.stringify(body).length : 0,
      success: res.statusCode < 400
    });

    return originalSend.call(this, body);
  };

  next();
}
