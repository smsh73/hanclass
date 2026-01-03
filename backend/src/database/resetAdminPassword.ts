import bcrypt from 'bcryptjs';
import { query } from './connection';
import { logger } from '../utils/logger';

/**
 * 관리자 비밀번호를 강제로 Admin@2026로 리셋하는 스크립트
 * 이 스크립트는 서버 시작 시 자동으로 실행되거나 수동으로 실행할 수 있습니다.
 */
export async function resetAdminPassword() {
  try {
    const defaultPassword = 'Admin@2026';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 관리자 계정이 있는지 확인
    const result = await query(
      'SELECT * FROM admin_users WHERE username = $1',
      ['admin']
    );

    if (result.rows.length === 0) {
      // 관리자 계정이 없으면 생성
      await query(
        'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
        ['admin', passwordHash]
      );
      logger.info('Admin user created with password: Admin@2026');
    } else {
      // 관리자 계정이 있으면 비밀번호를 강제로 업데이트
      await query(
        'UPDATE admin_users SET password_hash = $1 WHERE username = $2',
        [passwordHash, 'admin']
      );
      logger.info('Admin user password reset to: Admin@2026');
    }
  } catch (error) {
    logger.error('Failed to reset admin password', error);
    throw error;
  }
}

// 스크립트로 직접 실행할 경우
if (require.main === module) {
  import('./connection').then(async ({ initDatabase }) => {
    try {
      await initDatabase();
      await resetAdminPassword();
      logger.info('Admin password reset completed');
      process.exit(0);
    } catch (error) {
      logger.error('Failed to reset admin password', error);
      process.exit(1);
    }
  });
}
