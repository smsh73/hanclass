import bcrypt from 'bcryptjs';
import { query } from './connection';
import { logger } from '../utils/logger';

export async function initAdminUser() {
  try {
    // Check if admin user exists
    const result = await query(
      'SELECT * FROM admin_users WHERE username = $1',
      ['admin']
    );

    const defaultPassword = 'Admin@2026';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    if (result.rows.length > 0) {
      // 기존 관리자 계정이 있으면 비밀번호를 기본값으로 업데이트
      const currentPasswordHash = result.rows[0].password_hash;
      const isPasswordCorrect = await bcrypt.compare(defaultPassword, currentPasswordHash);
      
      if (!isPasswordCorrect) {
        // 비밀번호가 기본값이 아니면 업데이트
        await query(
          'UPDATE admin_users SET password_hash = $1 WHERE username = $2',
          [passwordHash, 'admin']
        );
        logger.info('Admin user password updated to default: username=admin, password=Admin@2026');
      } else {
        logger.info('Admin user already exists with correct password');
      }
      return;
    }

    // Create default admin user (password: Admin@2026)
    await query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
      ['admin', passwordHash]
    );

    logger.info('Default admin user created: username=admin, password=Admin@2026');
  } catch (error) {
    logger.error('Failed to initialize admin user', error);
    throw error;
  }
}

