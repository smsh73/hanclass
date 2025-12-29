/**
 * Voice recognition and synthesis utilities using Web Speech API
 */

export interface VoiceRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export class VoiceRecognition {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private silenceTimeout: NodeJS.Timeout | null = null;
  private lastSpeechTime: number = 0;
  private onResultCallback?: (text: string, isFinal: boolean) => void;
  private onSilenceCallback?: () => void;
  private silenceDuration: number = 2000; // 2 seconds

  constructor(options: VoiceRecognitionOptions = {}) {
    if (typeof window === 'undefined') {
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = options.lang || 'ko-KR';
    this.recognition.continuous = options.continuous ?? true;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.maxAlternatives = options.maxAlternatives ?? 1;

          this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            const results = event.results;
            const lastResult = results[results.length - 1];
            const transcript = lastResult[0]?.transcript || '';

            this.lastSpeechTime = Date.now();

            if (this.onResultCallback) {
              this.onResultCallback(transcript, lastResult.isFinal);
            }

            // Reset silence timeout
            this.resetSilenceTimeout();
          };

          this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
              // No speech detected, trigger silence callback after timeout
              this.resetSilenceTimeout();
            }
          };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart if still listening
        try {
          this.recognition?.start();
        } catch (error) {
          // Already started or other error
        }
      }
    };
  }

  start() {
    if (!this.recognition || this.isListening) {
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.lastSpeechTime = Date.now();
      this.resetSilenceTimeout();
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }

  stop() {
    if (!this.recognition || !this.isListening) {
      return;
    }

    this.isListening = false;
    this.recognition.stop();
    this.clearSilenceTimeout();
  }

  onResult(callback: (text: string, isFinal: boolean) => void) {
    this.onResultCallback = callback;
  }

  onSilence(callback: () => void) {
    this.onSilenceCallback = callback;
  }

  setSilenceDuration(ms: number) {
    this.silenceDuration = ms;
  }

  private resetSilenceTimeout() {
    this.clearSilenceTimeout();
    this.silenceTimeout = setTimeout(() => {
      const timeSinceLastSpeech = Date.now() - this.lastSpeechTime;
      if (timeSinceLastSpeech >= this.silenceDuration && this.onSilenceCallback) {
        this.onSilenceCallback();
      }
    }, this.silenceDuration);
  }

  private clearSilenceTimeout() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  destroy() {
    this.stop();
    this.clearSilenceTimeout();
  }
}

export class VoiceSynthesis {
  private synth: SpeechSynthesis;
  private isSpeaking: boolean = false;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;
  private onErrorCallback?: (error: Error) => void;

  constructor() {
    if (typeof window === 'undefined') {
      throw new Error('VoiceSynthesis requires browser environment');
    }

    this.synth = window.speechSynthesis;
  }

  speak(
    text: string,
    options: {
      lang?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      voice?: SpeechSynthesisVoice;
    } = {}
  ) {
    if (this.isSpeaking) {
      this.stop();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || 'ko-KR';
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    if (options.voice) {
      utterance.voice = options.voice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onStartCallback) {
        this.onStartCallback();
      }
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error(`Speech synthesis error: ${event.error}`));
      }
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.isSpeaking) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  onStart(callback: () => void) {
    this.onStartCallback = callback;
  }

  onEnd(callback: () => void) {
    this.onEndCallback = callback;
  }

  onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices().filter((voice) => voice.lang.startsWith('ko'));
  }

  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }
}

