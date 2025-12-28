import { initDatabase } from './connection';
import { logger } from '../utils/logger';

async function migrate() {
  try {
    await initDatabase();
    logger.info('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', error);
    process.exit(1);
  }
}

migrate();
