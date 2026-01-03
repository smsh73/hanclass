import bcrypt from 'bcryptjs';
import { query } from './connection';
import { logger } from '../utils/logger';

/**
 * 비밀번호 해시 테스트 및 검증 스크립트
 * 이 스크립트는 데이터베이스에 저장된 비밀번호 해시와 
 * 실제 비밀번호 'Admin@2026'을 비교하여 문제를 진단합니다.
 */
export async function testPasswordHash() {
  try {
    const testPassword = 'Admin@2026';
    
    // 데이터베이스에서 관리자 사용자 조회
    const result = await query(
      'SELECT * FROM admin_users WHERE username = $1',
      ['admin']
    );

    if (result.rows.length === 0) {
      logger.warn('Admin user not found in database');
      return;
    }

    const user = result.rows[0];
    const storedHash = user.password_hash;

    logger.info('Password hash test', {
      username: user.username,
      storedHashLength: storedHash?.length,
      storedHashPrefix: storedHash?.substring(0, 30),
    });

    // 새로운 해시 생성
    const newHash = await bcrypt.hash(testPassword, 10);
    logger.info('New hash generated', {
      newHashLength: newHash.length,
      newHashPrefix: newHash.substring(0, 30),
    });

    // 저장된 해시와 새 비밀번호 비교
    const isValid = await bcrypt.compare(testPassword, storedHash);
    logger.info('Password comparison result', {
      isValid,
      testPassword,
    });

    // 새 해시와 새 비밀번호 비교 (항상 true여야 함)
    const newHashValid = await bcrypt.compare(testPassword, newHash);
    logger.info('New hash comparison result', {
      newHashValid,
      testPassword,
    });

    if (!isValid) {
      logger.error('STORED PASSWORD HASH IS INVALID! Resetting...');
      
      // 비밀번호 해시 업데이트
      await query(
        'UPDATE admin_users SET password_hash = $1 WHERE username = $2',
        [newHash, 'admin']
      );
      
      logger.info('Password hash has been reset');
      
      // 다시 검증
      const verifyResult = await query(
        'SELECT password_hash FROM admin_users WHERE username = $1',
        ['admin']
      );
      
      const verifyHash = verifyResult.rows[0].password_hash;
      const verifyValid = await bcrypt.compare(testPassword, verifyHash);
      
      logger.info('Verification after reset', {
        verifyValid,
        verifyHashPrefix: verifyHash.substring(0, 30),
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Password hash test failed', error);
    throw error;
  }
}
