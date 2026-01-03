import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initDatabase } from './database/connection';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { aiService } from './services/aiService';
import { apiLimiter, authLimiter, aiLimiter } from './middleware/rateLimiter';
import { setupSwagger } from './config/swagger';

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
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

// CORS 설정 강화 - 특정 도메인만 허용
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // origin이 없는 경우 (같은 도메인 요청, Postman 등) 허용
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root path
app.get('/', (req, res) => {
  res.json({ 
    message: 'HANCLASS Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger API Documentation
setupSwagger(app);

// Request Logger (모든 요청 로깅)
import { requestLogger } from './middleware/requestLogger';
app.use(requestLogger);

// Rate Limiting 적용
app.use('/api', apiLimiter);

// Routes with specific rate limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/conversation', aiLimiter, conversationRoutes);
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
    // 데이터베이스 연결 정보 로깅 (비밀번호 제외)
    logger.info('Database configuration', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'hanclass',
      user: process.env.DB_USER || 'hanclass',
      ssl: process.env.DB_HOST?.includes('azure.com') || process.env.AZURE_DB === 'true',
    });

    await initDatabase();
    logger.info('Database initialized successfully');

    // Test password hash after initialization
    const { testPasswordHash } = await import('./database/testPassword');
    await testPasswordHash();

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
    // 데이터베이스 연결 실패 시에도 서버는 시작 (일부 기능만 제한)
    logger.warn('Starting server without database connection. Some features may be limited.');
    const HOST = process.env.HOSTNAME || '0.0.0.0';
    httpServer.listen(PORT, HOST, () => {
      logger.info(`Server running on ${HOST}:${PORT} (without database)`);
    });
  }
}

startServer();

export { io };

