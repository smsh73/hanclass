import { body, param, query, ValidationChain, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Validation 결과 처리 미들웨어
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : undefined,
      message: err.msg,
    }));
    throw new AppError(`Validation failed: ${errorMessages.map(e => e.message).join(', ')}`, 400);
  }
  next();
};

/**
 * 인증 관련 Validation
 */
export const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

/**
 * 세션 생성 Validation
 */
export const validateCreateSession = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters')
    .matches(/^[가-힣a-zA-Z\s]+$/)
    .withMessage('Name can only contain Korean, English letters, and spaces'),
  handleValidationErrors,
];

/**
 * 대화 시작 Validation
 */
export const validateStartConversation = [
  body('topic')
    .trim()
    .notEmpty()
    .withMessage('Topic is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Topic must be between 1 and 255 characters'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced'),
  body('sessionId')
    .optional()
    .isUUID()
    .withMessage('SessionId must be a valid UUID'),
  handleValidationErrors,
];

/**
 * 대화 메시지 Validation
 */
export const validateConversationMessage = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('topic')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Topic must be less than 255 characters'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced'),
  handleValidationErrors,
];

/**
 * 레벨 테스트 제출 Validation
 */
export const validateLevelTestSubmit = [
  body('sessionId')
    .notEmpty()
    .withMessage('SessionId is required')
    .isUUID()
    .withMessage('SessionId must be a valid UUID'),
  body('answers')
    .isArray()
    .withMessage('Answers must be an array')
    .notEmpty()
    .withMessage('Answers array cannot be empty'),
  body('answers.*.questionId')
    .isInt({ min: 1 })
    .withMessage('QuestionId must be a positive integer'),
  body('answers.*.answer')
    .notEmpty()
    .withMessage('Answer is required'),
  handleValidationErrors,
];

/**
 * 단어 게임 체크 Validation
 */
export const validateWordGameCheck = [
  body('word')
    .trim()
    .notEmpty()
    .withMessage('Word is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Word must be between 1 and 100 characters'),
  body('userAnswer')
    .trim()
    .notEmpty()
    .withMessage('UserAnswer is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('UserAnswer must be between 1 and 100 characters'),
  handleValidationErrors,
];

/**
 * 세션 ID 파라미터 Validation
 */
export const validateSessionId = [
  param('sessionId')
    .isUUID()
    .withMessage('SessionId must be a valid UUID'),
  handleValidationErrors,
];
