import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { Readable } from 'stream';
import { logger } from '../utils/logger';

export interface ParsedDocument {
  text: string;
  metadata?: {
    title?: string;
    author?: string;
    pages?: number;
  };
}

export class DocumentParser {
  /**
   * Parse Word document (.docx)
   */
  async parseWord(buffer: Buffer): Promise<ParsedDocument> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      
      // 한글 인코딩 보장
      const text = result.value
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n');

      logger.info('Word document parsed successfully', {
        length: text.length,
      });

      return {
        text,
        metadata: {
          title: this.extractTitle(text),
        },
      };
    } catch (error) {
      logger.error('Failed to parse Word document', error);
      throw new Error(`Word parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse PDF document
   */
  async parsePDF(buffer: Buffer): Promise<ParsedDocument> {
    try {
      const data = await pdfParse(buffer);
      
      // 한글 인코딩 보장
      const text = data.text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n');

      logger.info('PDF document parsed successfully', {
        length: text.length,
        pages: data.numpages,
      });

      return {
        text,
        metadata: {
          title: data.info?.Title || this.extractTitle(text),
          author: data.info?.Author,
          pages: data.numpages,
        },
      };
    } catch (error) {
      logger.error('Failed to parse PDF document', error);
      throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse document based on file extension
   */
  async parseDocument(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    const extension = filename.toLowerCase().split('.').pop();

    switch (extension) {
      case 'docx':
        return this.parseWord(buffer);
      case 'pdf':
        return this.parsePDF(buffer);
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  /**
   * Extract title from text (first line or first sentence)
   */
  private extractTitle(text: string): string {
    const lines = text.split('\n').filter((line) => line.trim().length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // If first line is too long, take first sentence
      if (firstLine.length > 100) {
        const sentences = firstLine.split(/[.!?。！？]/);
        return sentences[0]?.trim() || firstLine.substring(0, 100);
      }
      return firstLine;
    }
    return 'Untitled';
  }

  /**
   * Extract structured content from text
   */
  extractStructuredContent(text: string): {
    sections: Array<{ title: string; content: string }>;
    topics: string[];
    vocabulary: string[];
  } {
    const sections: Array<{ title: string; content: string }> = [];
    const topics: string[] = [];
    const vocabulary: string[] = [];

    // Split by common section markers
    const lines = text.split('\n');
    let currentSection: { title: string; content: string } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect section headers (lines that are short and end with colon or are numbered)
      if (
        trimmed.length < 100 &&
        (trimmed.endsWith(':') ||
          /^\d+[\.\)]\s/.test(trimmed) ||
          /^[가-힣]+:\s*$/.test(trimmed))
      ) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmed.replace(/[:：]$/, ''),
          content: '',
        };
        topics.push(currentSection.title);
      } else if (currentSection) {
        currentSection.content += trimmed + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    // Extract vocabulary (words that might be Korean vocabulary)
    // This is a simple heuristic - can be improved
    const words = text.match(/[가-힣]{2,}/g) || [];
    vocabulary.push(...Array.from(new Set(words)).slice(0, 50));

    return {
      sections,
      topics,
      vocabulary,
    };
  }
}

export const documentParser = new DocumentParser();

