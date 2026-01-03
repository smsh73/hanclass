import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode?: number;
  status?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.status = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.error('[ERROR HANDLER]', {
    errorId,
    statusCode,
    message,
    path: req.path,
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body && Object.keys(req.body).length > 0 ? {
      ...req.body,
      password: req.body.password ? '***' : undefined,
      apiKey: req.body.apiKey ? '***' : undefined,
    } : undefined,
    headers: {
      'user-agent': req.headers['user-agent'],
      'origin': req.headers['origin'],
      'referer': req.headers['referer']
    },
    ip: req.ip || req.connection.remoteAddress,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    errorName: err.name,
    errorCode: (err as any).code
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      errorId: process.env.NODE_ENV === 'development' ? errorId : undefined,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

