import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initDatabase } from './database/connection';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { aiService } from './services/aiService';

// Routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import curriculumRoutes from './routes/curriculum';
import conversationRoutes from './routes/conversation';
import levelTestRoutes from './routes/levelTest';
import wordGameRoutes from './routes/wordGame';
import sessionRoutes from './routes/session';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Azure App Service는 PORT 환경 변수를 자동으로 설정 (기본값: 8080)
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/level-test', levelTestRoutes);
app.use('/api/word-game', wordGameRoutes);
app.use('/api/session', sessionRoutes);

// Socket.IO for real-time conversation
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handler
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    logger.info('Database initialized successfully');

    // Initialize AI service
    await aiService.initialize();
    logger.info('AI service initialized successfully');

    // Azure App Service는 0.0.0.0으로 바인딩해야 함
    const HOST = process.env.HOSTNAME || '0.0.0.0';
    httpServer.listen(PORT, HOST, () => {
      logger.info(`Server running on ${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { io };

