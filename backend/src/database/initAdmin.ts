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

    if (result.rows.length > 0) {
      logger.info('Admin user already exists');
      return;
    }

    // Create default admin user (password: admin123)
    const passwordHash = await bcrypt.hash('admin123', 10);
    await query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
      ['admin', passwordHash]
    );

    logger.info('Default admin user created: username=admin, password=admin123');
  } catch (error) {
    logger.error('Failed to initialize admin user', error);
    throw error;
  }
}

