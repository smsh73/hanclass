import { query } from '../database/connection';
import { documentParser, DocumentParser } from './documentParser';
import { aiService } from './aiService';
import { logger } from '../utils/logger';

export interface CurriculumData {
  title: string;
  description: string;
  level?: string;
  content: Array<{
    type: string;
    data: any;
    order: number;
  }>;
}

export class CurriculumService {
  /**
   * Generate curriculum from parsed document
   */
  async generateCurriculum(
    documentText: string,
    metadata?: { title?: string }
  ): Promise<CurriculumData> {
    try {
      // Extract structured content
      const structured = documentParser.extractStructuredContent(documentText);

      // Use AI to analyze and structure the content
      const aiPrompt = `다음은 한국어 교안 문서입니다. 이 문서를 분석하여 학습 커리큘럼을 생성해주세요.

문서 내용:
${documentText.substring(0, 5000)}...

다음 JSON 형식으로 응답해주세요:
{
  "title": "커리큘럼 제목",
  "description": "커리큘럼 설명",
  "level": "beginner|intermediate|advanced",
  "topics": ["주제1", "주제2", ...],
  "vocabulary": ["단어1", "단어2", ...],
  "dialogues": [
    {
      "situation": "상황 설명",
      "korean": "한국어 대화",
      "translation": "번역"
    }
  ]
}

JSON만 응답하고 다른 설명은 포함하지 마세요.`;

      const aiResponse = await aiService.chat([
        {
          role: 'user',
          content: aiPrompt,
        },
      ]);

      // Parse AI response
      let curriculumData: any;
      try {
        // Extract JSON from response
        const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          curriculumData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        logger.warn('Failed to parse AI response as JSON, using fallback', parseError);
        // Fallback to structured extraction
        curriculumData = {
          title: metadata?.title || '새 커리큘럼',
          description: '자동 생성된 커리큘럼',
          level: this.detectLevel(documentText),
          topics: structured.topics,
          vocabulary: structured.vocabulary,
          dialogues: [],
        };
      }

      // Generate word games from vocabulary
      const wordGames = this.generateWordGames(
        curriculumData.vocabulary || [],
        curriculumData.level || 'beginner'
      );

      return {
        title: curriculumData.title || metadata?.title || '새 커리큘럼',
        description: curriculumData.description || '자동 생성된 커리큘럼',
        level: curriculumData.level || 'beginner',
        content: [
          ...(curriculumData.topics?.map((topic: string, index: number) => ({
            type: 'topic',
            data: { title: topic, content: '' },
            order: index,
          })) || []),
          ...(curriculumData.dialogues?.map((dialogue: any, index: number) => ({
            type: 'dialogue',
            data: dialogue,
            order: index + (curriculumData.topics?.length || 0),
          })) || []),
          ...wordGames.map((word, index) => ({
            type: 'vocabulary',
            data: word,
            order: index + 1000, // Put vocabulary at the end
          })),
        ],
      };
    } catch (error) {
      logger.error('Failed to generate curriculum', error);
      throw error;
    }
  }

  /**
   * Save curriculum to database
   */
  async saveCurriculum(curriculum: CurriculumData): Promise<number> {
    try {
      // Insert curriculum
      const curriculumResult = await query(
        `INSERT INTO curriculums (title, description, level)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [curriculum.title, curriculum.description, curriculum.level || 'beginner']
      );

      const curriculumId = curriculumResult.rows[0].id;

      // Insert curriculum content
      for (const item of curriculum.content) {
        await query(
          `INSERT INTO curriculum_content (curriculum_id, content_type, content_data, order_index)
           VALUES ($1, $2, $3, $4)`,
          [curriculumId, item.type, JSON.stringify(item.data), item.order]
        );
      }

      logger.info('Curriculum saved', { curriculumId, title: curriculum.title });
      return curriculumId;
    } catch (error) {
      logger.error('Failed to save curriculum', error);
      throw error;
    }
  }

  /**
   * Generate word games from vocabulary
   */
  private generateWordGames(
    vocabulary: string[],
    level: string
  ): Array<{ word: string; difficulty: number }> {
    const wordGames: Array<{ word: string; difficulty: number }> = [];

    for (const word of vocabulary) {
      const wordLength = word.length;
      let difficulty = 1;
      let gameLevel = 'beginner';

      if (level === 'beginner') {
        if (wordLength <= 2) {
          difficulty = 1;
          gameLevel = 'beginner';
        } else if (wordLength <= 4) {
          difficulty = 2;
          gameLevel = 'beginner';
        } else {
          difficulty = 3;
          gameLevel = 'intermediate';
        }
      } else if (level === 'intermediate') {
        if (wordLength <= 2) {
          difficulty = 2;
          gameLevel = 'beginner';
        } else if (wordLength <= 4) {
          difficulty = 5;
          gameLevel = 'intermediate';
        } else {
          difficulty = 7;
          gameLevel = 'intermediate';
        }
      } else {
        // advanced
        if (wordLength <= 4) {
          difficulty = 5;
          gameLevel = 'intermediate';
        } else {
          difficulty = 8;
          gameLevel = 'advanced';
        }
      }

      wordGames.push({ word, difficulty });
    }

    return wordGames;
  }

  /**
   * Detect level from document text
   */
  private detectLevel(text: string): string {
    const beginnerKeywords = ['안녕', '감사', '죄송', '처음', '기초'];
    const intermediateKeywords = ['이유', '방법', '경험', '의견'];
    const advancedKeywords = ['분석', '논의', '비교', '전문'];

    const lowerText = text.toLowerCase();

    let beginnerCount = 0;
    let intermediateCount = 0;
    let advancedCount = 0;

    for (const keyword of beginnerKeywords) {
      if (lowerText.includes(keyword)) beginnerCount++;
    }
    for (const keyword of intermediateKeywords) {
      if (lowerText.includes(keyword)) intermediateCount++;
    }
    for (const keyword of advancedKeywords) {
      if (lowerText.includes(keyword)) advancedCount++;
    }

    if (advancedCount > intermediateCount && advancedCount > beginnerCount) {
      return 'advanced';
    } else if (intermediateCount > beginnerCount) {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }

  /**
   * Get curriculum by ID
   */
  async getCurriculum(id: number) {
    const result = await query(
      `SELECT * FROM curriculums WHERE id = $1`,
      [id]
    ) as any;

    if (result.rows.length === 0) {
      return null;
    }

    const curriculum = result.rows[0];

    const contentResult = await query(
      `SELECT * FROM curriculum_content 
       WHERE curriculum_id = $1 
       ORDER BY order_index ASC`,
      [id]
    );

    return {
      ...curriculum,
      content: contentResult.rows.map((row) => ({
        type: row.content_type,
        data: row.content_data,
        order: row.order_index,
      })),
    };
  }

  /**
   * Get all curriculums
   */
  async getAllCurriculums() {
    const result = await query(
      `SELECT * FROM curriculums ORDER BY created_at DESC`
    );
    return result.rows;
  }
}

export const curriculumService = new CurriculumService();

