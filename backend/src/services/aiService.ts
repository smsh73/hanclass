import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../database/connection';
import { logger } from '../utils/logger';

export type AIProvider = 'openai' | 'claude' | 'gemini';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

class AIService {
  private openaiClient: OpenAI | null = null;
  private claudeClient: Anthropic | null = null;
  private geminiClient: GoogleGenerativeAI | null = null;
  private configs: Map<AIProvider, AIConfig> = new Map();
  private primaryProvider: AIProvider | null = null;
  private fallbackProviders: AIProvider[] = [];

  async initialize() {
    await this.loadConfigs();
    await this.initializeClients();
  }

  private decryptApiKey(encryptedKey: string): string {
    try {
      // Check if key is encrypted (contains ':')
      if (!encryptedKey.includes(':')) {
        return encryptedKey; // Not encrypted, return as is
      }

      const crypto = require('crypto');
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!', 'utf8');
      const parts = encryptedKey.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.warn('Failed to decrypt API key, using as is', error);
      return encryptedKey; // Return encrypted key if decryption fails
    }
  }

  private async loadConfigs() {
    try {
      const result = await query(
        `SELECT provider, api_key, is_primary, is_active 
         FROM api_keys 
         WHERE is_active = true 
         ORDER BY is_primary DESC, created_at ASC`
      );

      this.configs.clear();
      this.primaryProvider = null;
      this.fallbackProviders = [];

      for (const row of result.rows) {
        const decryptedKey = this.decryptApiKey(row.api_key);
        const config: AIConfig = {
          provider: row.provider as AIProvider,
          apiKey: decryptedKey,
          isPrimary: row.is_primary,
          isActive: row.is_active,
        };

        this.configs.set(config.provider, config);

        if (config.isPrimary) {
          this.primaryProvider = config.provider;
        } else {
          this.fallbackProviders.push(config.provider);
        }
      }

      logger.info('AI configs loaded', {
        primary: this.primaryProvider,
        fallbacks: this.fallbackProviders,
      });
    } catch (error) {
      logger.error('Failed to load AI configs', error);
    }
  }

  private async initializeClients() {
    // Initialize OpenAI
    const openaiConfig = this.configs.get('openai');
    if (openaiConfig) {
      this.openaiClient = new OpenAI({ apiKey: openaiConfig.apiKey });
    } else if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    // Initialize Claude
    const claudeConfig = this.configs.get('claude');
    if (claudeConfig) {
      this.claudeClient = new Anthropic({ apiKey: claudeConfig.apiKey });
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }

    // Initialize Gemini
    const geminiConfig = this.configs.get('gemini');
    if (geminiConfig) {
      this.geminiClient = new GoogleGenerativeAI(geminiConfig.apiKey);
    } else if (process.env.GOOGLE_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    }
  }

  async chat(
    messages: AIMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<AIResponse> {
    const providers = this.primaryProvider
      ? [this.primaryProvider, ...this.fallbackProviders]
      : this.fallbackProviders.length > 0
      ? this.fallbackProviders
      : (['openai', 'claude', 'gemini'] as AIProvider[]);

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        const response = await this.callProvider(provider, messages, options);
        logger.info('AI response successful', { provider });
        return response;
      } catch (error: any) {
        logger.warn(`AI provider ${provider} failed, trying fallback`, {
          error: error?.message || String(error),
        });
        if (error instanceof Error) {
          lastError = error;
        } else {
          lastError = new Error(String(error));
        }
        // Continue to next provider
      }
    }

    throw lastError || new Error('All AI providers failed');
  }

  private async callProvider(
    provider: AIProvider,
    messages: AIMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<AIResponse> {
    const timeout = 30000; // 30 seconds

    switch (provider) {
      case 'openai':
        return this.callOpenAI(messages, options, timeout);
      case 'claude':
        return this.callClaude(messages, options, timeout);
      case 'gemini':
        return this.callGemini(messages, options, timeout);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async callOpenAI(
    messages: AIMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    },
    timeout: number = 30000
  ): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const formattedMessages = options?.systemPrompt
      ? [{ role: 'system' as const, content: options.systemPrompt }, ...messages]
      : messages;

    const response = await Promise.race([
      this.openaiClient.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: formattedMessages as any,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI request timeout')), timeout)
      ),
    ]);

    return {
      content: response.choices[0]?.message?.content || '',
      provider: 'openai',
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  private async callClaude(
    messages: AIMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    },
    timeout: number = 30000
  ): Promise<AIResponse> {
    if (!this.claudeClient) {
      throw new Error('Claude client not initialized');
    }

    const systemMessage = options?.systemPrompt || '';
    const formattedMessages = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    const response = await Promise.race([
      this.claudeClient.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: options?.maxTokens ?? 1000,
        temperature: options?.temperature ?? 0.7,
        system: systemMessage,
        messages: formattedMessages as any,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Claude request timeout')), timeout)
      ),
    ]);

    return {
      content: response.content[0]?.type === 'text' ? response.content[0].text : '',
      provider: 'claude',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  private async callGemini(
    messages: AIMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    },
    timeout: number = 30000
  ): Promise<AIResponse> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const model = this.geminiClient.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 1000,
      },
    });

    // Convert messages to Gemini format
    const chat = model.startChat({
      history: messages
        .slice(0, -1)
        .map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
    });

    const lastMessage = messages[messages.length - 1];
    const response = await Promise.race([
      chat.sendMessage(lastMessage.content),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini request timeout')), timeout)
      ),
    ]);

    const text = response.response.text();

    return {
      content: text,
      provider: 'gemini',
    };
  }

  async testConnection(provider: AIProvider): Promise<boolean> {
    try {
      const testMessages: AIMessage[] = [
        { role: 'user', content: 'Hello' },
      ];
      await this.callProvider(provider, testMessages, { maxTokens: 10 });
      return true;
    } catch (error) {
      logger.error(`Connection test failed for ${provider}`, error);
      return false;
    }
  }

  async reloadConfigs() {
    await this.initialize();
  }
}

export const aiService = new AIService();

