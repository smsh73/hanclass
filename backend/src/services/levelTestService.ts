import { query } from '../database/connection';
import { logger } from '../utils/logger';

export interface LevelTestQuestion {
  id: number;
  question: string;
  type: 'reading' | 'listening' | 'speaking' | 'writing';
  level: 'beginner' | 'intermediate' | 'advanced';
  options?: string[];
  correctAnswer?: string;
}

export interface LevelTestResult {
  score: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  details: {
    reading: number;
    listening: number;
    speaking: number;
    writing: number;
  };
}

export class LevelTestService {
  private questions: LevelTestQuestion[] = [
    // Beginner questions
    {
      id: 1,
      question: '안녕하세요는 무슨 뜻인가요?',
      type: 'reading',
      level: 'beginner',
      options: ['Hello', 'Thank you', 'Sorry', 'Goodbye'],
      correctAnswer: 'Hello',
    },
    {
      id: 2,
      question: '감사합니다는 무슨 뜻인가요?',
      type: 'reading',
      level: 'beginner',
      options: ['Hello', 'Thank you', 'Sorry', 'Goodbye'],
      correctAnswer: 'Thank you',
    },
    {
      id: 3,
      question: '한국어로 "Hello"를 말해보세요.',
      type: 'speaking',
      level: 'beginner',
      correctAnswer: '안녕하세요',
    },
    // Intermediate questions
    {
      id: 4,
      question: '오늘 날씨가 어때요?',
      type: 'reading',
      level: 'intermediate',
      options: ['How is the weather today?', 'What time is it?', 'Where are you?', 'How are you?'],
      correctAnswer: 'How is the weather today?',
    },
    {
      id: 5,
      question: '한국어로 "How are you?"를 말해보세요.',
      type: 'speaking',
      level: 'intermediate',
      correctAnswer: '어떻게 지내세요?',
    },
    // Advanced questions
    {
      id: 6,
      question: '한국 문화에 대해 설명해보세요.',
      type: 'speaking',
      level: 'advanced',
    },
  ];

  /**
   * Get test questions for a specific level
   */
  getQuestions(level?: 'beginner' | 'intermediate' | 'advanced'): LevelTestQuestion[] {
    if (level) {
      return this.questions.filter((q) => q.level === level);
    }
    // Return mixed questions
    return this.questions;
  }

  /**
   * Evaluate test answers
   */
  async evaluateTest(
    userId: number,
    answers: Array<{ questionId: number; answer: string; type: string }>
  ): Promise<LevelTestResult> {
    const scores = {
      reading: 0,
      listening: 0,
      speaking: 0,
      writing: 0,
    };

    let totalScore = 0;
    let maxScore = 0;

    for (const answer of answers) {
      const question = this.questions.find((q) => q.id === answer.questionId);
      if (!question) continue;

      maxScore += 10;

      if (question.type === 'speaking') {
        // For speaking, use AI to evaluate (simplified for now)
        const isCorrect = this.evaluateSpeakingAnswer(
          answer.answer,
          question.correctAnswer || ''
        );
        if (isCorrect) {
          scores.speaking += 10;
          totalScore += 10;
        }
      } else {
        // For other types, compare directly
        if (answer.answer.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()) {
          scores[question.type as keyof typeof scores] += 10;
          totalScore += 10;
        }
      }
    }

    // Determine level based on score
    const percentage = (totalScore / maxScore) * 100;
    let level: 'beginner' | 'intermediate' | 'advanced';
    
    if (percentage >= 80) {
      level = 'advanced';
    } else if (percentage >= 50) {
      level = 'intermediate';
    } else {
      level = 'beginner';
    }

    // Save test result
    await query(
      `INSERT INTO level_tests (user_id, score, level, test_data)
       VALUES ($1, $2, $3, $4)`,
      [
        userId,
        totalScore,
        level,
        JSON.stringify({ answers, scores, percentage }),
      ]
    );

    // Update user level
    await query(
      `UPDATE users SET level = $1 WHERE id = $2`,
      [level, userId]
    );

    return {
      score: totalScore,
      level,
      details: scores,
    };
  }

  /**
   * Evaluate speaking answer (simplified - can be enhanced with AI)
   */
  private evaluateSpeakingAnswer(userAnswer: string, correctAnswer: string): boolean {
    // Simple similarity check
    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedCorrect = correctAnswer.toLowerCase().trim();
    
    // Exact match
    if (normalizedUser === normalizedCorrect) {
      return true;
    }

    // Partial match (contains key words)
    const correctWords = normalizedCorrect.split(/\s+/);
    const userWords = normalizedUser.split(/\s+/);
    const matchingWords = correctWords.filter((word) =>
      userWords.some((uw) => uw.includes(word) || word.includes(uw))
    );

    return matchingWords.length >= correctWords.length * 0.7;
  }

  /**
   * Get test result for user
   */
  async getTestResult(userId: number) {
    const result = await query(
      `SELECT * FROM level_tests 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }
}

export const levelTestService = new LevelTestService();

