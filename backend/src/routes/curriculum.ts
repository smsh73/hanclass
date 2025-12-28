import express from 'express';
import multer from 'multer';
import { curriculumService } from '../services/curriculumService';
import { documentParser } from '../services/documentParser';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Get all curriculums
router.get('/', async (req, res, next) => {
  try {
    const curriculums = await curriculumService.getAllCurriculums();
    res.json({ success: true, curriculums });
  } catch (error) {
    next(error);
  }
});

// Get curriculum by ID
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError('Invalid curriculum ID', 400);
    }

    const curriculum = await curriculumService.getCurriculum(id);
    if (!curriculum) {
      throw new AppError('Curriculum not found', 404);
    }

    res.json({ success: true, curriculum });
  } catch (error) {
    next(error);
  }
});

// Upload and create curriculum (Admin only)
router.post(
  '/upload',
  authenticateToken,
  requireAdmin,
  upload.array('files', 10),
  async (req: AuthRequest, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      const curriculumIds: number[] = [];

      for (const file of files) {
        try {
          // Parse document
          const parsed = await documentParser.parseDocument(file.buffer, file.originalname);

          // Generate curriculum
          const curriculumData = await curriculumService.generateCurriculum(
            parsed.text,
            { title: parsed.metadata?.title }
          );

          // Save to database
          const curriculumId = await curriculumService.saveCurriculum(curriculumData);
          curriculumIds.push(curriculumId);
        } catch (error: any) {
          console.error(`Failed to process file ${file.originalname}:`, error);
          // Continue with other files
        }
      }

      res.json({
        success: true,
        curriculumIds,
        message: `${curriculumIds.length}개의 커리큘럼이 생성되었습니다.`,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
