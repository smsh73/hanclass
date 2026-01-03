import express from 'express';
import { query } from '../database/connection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import { validateLogin } from '../middleware/validate';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 관리자 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: Admin@2026
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    // Validation은 validateLogin 미들웨어에서 처리됨

    logger.info('Login attempt', { username, passwordLength: password?.length });

    const result = await query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      logger.warn('Login failed: user not found', { username });
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];
    logger.debug('User found', { 
      username: user.username, 
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash?.length 
    });

    const isValid = await bcrypt.compare(password, user.password_hash);
    logger.debug('Password comparison result', { isValid, providedPassword: password });

    if (!isValid) {
      logger.warn('Login failed: invalid password', { username });
      throw new AppError('Invalid credentials', 401);
    }

    // JWT Secret은 반드시 환경 변수로 설정되어야 함
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT_SECRET is not configured', 500);
    }

    const token = jwt.sign(
      { userId: user.id, role: 'admin' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

