import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HANCLASS Backend API',
      version: '1.0.0',
      description: '한국어학당 AI 인터랙티브 학습 서비스 API 문서',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://hanclass-backend.azurewebsites.net',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Error message',
                },
              },
            },
          },
        },
        Session: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            sessionId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: '홍길동',
            },
          },
        },
        ConversationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: '안녕하세요! 오늘은 무엇에 대해 이야기하고 싶으신가요?',
            },
            provider: {
              type: 'string',
              enum: ['openai', 'claude', 'gemini'],
              example: 'openai',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: '인증 관련 API',
      },
      {
        name: 'Session',
        description: '세션 관리 API',
      },
      {
        name: 'Conversation',
        description: '대화 학습 API',
      },
      {
        name: 'Level Test',
        description: '레벨 테스트 API',
      },
      {
        name: 'Word Game',
        description: '단어 게임 API',
      },
      {
        name: 'Admin',
        description: '관리자 API',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // API 경로
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'HANCLASS API Documentation',
  }));

  // Swagger JSON 엔드포인트
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
