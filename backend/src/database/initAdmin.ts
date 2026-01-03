import bcrypt from 'bcryptjs';
import { query } from './connection';
import { logger } from '../utils/logger';

export async function initAdminUser() {
  try {
    logger.info('Initializing admin user...');
    
    // Check if admin user exists
    const result = await query(
      'SELECT * FROM admin_users WHERE username = $1',
      ['admin']
    );

    const defaultPassword = 'Admin@2026';
    logger.debug('Hashing default password', { password: defaultPassword });
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    logger.debug('Password hash generated', { hashLength: passwordHash.length, hashPrefix: passwordHash.substring(0, 20) });

    if (result.rows.length > 0) {
      // 기존 관리자 계정이 있으면 비밀번호를 항상 기본값으로 강제 업데이트
      // 이렇게 하면 비밀번호가 무엇이든 항상 Admin@2026로 리셋됩니다
      logger.info('Admin user exists, resetting password...', { 
        existingUserId: result.rows[0].id,
        existingHashPrefix: result.rows[0].password_hash?.substring(0, 20) 
      });
      
      await query(
        'UPDATE admin_users SET password_hash = $1 WHERE username = $2',
        [passwordHash, 'admin']
      );
      
      // Verify the update
      const verifyResult = await query(
        'SELECT password_hash FROM admin_users WHERE username = $1',
        ['admin']
      );
      
      logger.info('Admin user password reset to default: username=admin, password=Admin@2026', {
        newHashPrefix: verifyResult.rows[0]?.password_hash?.substring(0, 20),
        hashMatches: verifyResult.rows[0]?.password_hash === passwordHash
      });
      return;
    }

    // Create default admin user (password: Admin@2026)
    logger.info('Creating new admin user...');
    await query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
      ['admin', passwordHash]
    );

    logger.info('Default admin user created: username=admin, password=Admin@2026', {
      hashPrefix: passwordHash.substring(0, 20)
    });
  } catch (error) {
    logger.error('Failed to initialize admin user', error);
    throw error;
  }
}

