import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

export interface TTSOptions {
  languageCode?: string;
  voiceName?: string;
  audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
  speakingRate?: number;
  pitch?: number;
}

export class VoiceService {
  private ttsClient: TextToSpeechClient | null = null;

  constructor() {
    // Initialize Google TTS client if credentials are available
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        this.ttsClient = new TextToSpeechClient();
        logger.info('Google TTS client initialized');
      } catch (error) {
        logger.warn('Failed to initialize Google TTS client', error);
      }
    }
  }

  /**
   * Convert text to speech using Google TTS
   */
  async textToSpeech(
    text: string,
    options: TTSOptions = {}
  ): Promise<Buffer> {
    if (!this.ttsClient) {
      throw new Error('Google TTS client not initialized. Set GOOGLE_APPLICATION_CREDENTIALS environment variable.');
    }

    try {
      const request = {
        input: { text },
        voice: {
          languageCode: options.languageCode || 'ko-KR',
          name: options.voiceName || 'ko-KR-Standard-A',
          ssmlGender: 'NEUTRAL' as const,
        },
        audioConfig: {
          audioEncoding: (options.audioEncoding || 'MP3') as any,
          speakingRate: options.speakingRate || 1.0,
          pitch: options.pitch || 0,
        },
      };

      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      if (!response.audioContent) {
        throw new Error('No audio content received from TTS');
      }

      return Buffer.from(response.audioContent);
    } catch (error) {
      logger.error('TTS synthesis failed', error);
      throw error;
    }
  }

  /**
   * Get available voices for Korean
   */
  async getKoreanVoices() {
    if (!this.ttsClient) {
      return [];
    }

    try {
      const [result] = await this.ttsClient.listVoices({
        languageCode: 'ko-KR',
      });

      return result.voices || [];
    } catch (error) {
      logger.error('Failed to list voices', error);
      return [];
    }
  }
}

export const voiceService = new VoiceService();

