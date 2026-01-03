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
  private onErrorCallback?: (error: string, message?: string) => void;
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

    try {
      this.recognition = new SpeechRecognition();
      if (!this.recognition) {
        console.warn('Failed to create SpeechRecognition instance');
        return;
      }
    } catch (error) {
      console.error('Failed to create SpeechRecognition:', error);
      return;
    }

    // TypeScript null 체크를 위한 assertion
    if (this.recognition) {
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
        console.error('Speech recognition error:', event.error, event.message);
        
        // 네트워크 오류는 재시도하지 않고 사용자에게 알림
        if (event.error === 'network') {
          const errorMsg = '음성 인식 네트워크 오류가 발생했습니다. 네트워크 연결을 확인해주세요.';
          console.warn('Speech recognition network error. This may be due to network connectivity or browser limitations.');
          if (this.onErrorCallback) {
            this.onErrorCallback('network', errorMsg);
          }
          // 네트워크 오류 시 자동 재시도 방지
          this.isListening = false;
          return;
        }
        
        // 일시적인 오류는 재시도 가능
        if (event.error === 'no-speech') {
          // No speech detected, trigger silence callback after timeout
          this.resetSilenceTimeout();
        } else if (event.error === 'aborted') {
          // 사용자가 중단한 경우, 재시도하지 않음
          this.isListening = false;
        } else if (event.error === 'not-allowed') {
          // 마이크 권한이 없는 경우
          const errorMsg = '마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
          console.warn('Microphone permission denied. Please allow microphone access.');
          if (this.onErrorCallback) {
            this.onErrorCallback('not-allowed', errorMsg);
          }
          this.isListening = false;
        } else if (event.error === 'service-not-allowed') {
          // Speech Recognition 서비스가 허용되지 않은 경우
          const errorMsg = '음성 인식 서비스를 사용할 수 없습니다.';
          console.warn('Speech Recognition service not allowed.');
          if (this.onErrorCallback) {
            this.onErrorCallback('service-not-allowed', errorMsg);
          }
          this.isListening = false;
        } else {
          // 기타 오류
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error, event.message || '음성 인식 오류가 발생했습니다.');
          }
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
  }

  async start() {
    if (!this.recognition || this.isListening) {
      return;
    }

    // 브라우저 환경 확인
    if (typeof window === 'undefined') {
      console.error('VoiceRecognition: Not in browser environment');
      return;
    }

    // HTTPS 확인 (로컬호스트 제외)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      const errorMsg = '음성 인식은 HTTPS 연결이 필요합니다.';
      console.error('VoiceRecognition: HTTPS required for speech recognition');
      if (this.onErrorCallback) {
        this.onErrorCallback('https-required', errorMsg);
      }
      return;
    }

    // 마이크 권한 확인 및 요청
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // 마이크 권한 요청
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // 스트림을 즉시 중지 (권한만 확인)
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted');
      } else {
        console.warn('getUserMedia not supported, proceeding with SpeechRecognition API');
      }
    } catch (error: any) {
      const errorMsg = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError'
        ? '마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.'
        : '마이크 접근에 실패했습니다.';
      console.error('Microphone permission error:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback('permission-denied', errorMsg);
      }
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.lastSpeechTime = Date.now();
      this.resetSilenceTimeout();
      console.log('Speech recognition started');
    } catch (error: any) {
      console.error('Failed to start recognition:', error);
      if (error.name === 'InvalidStateError') {
        // 이미 시작되었거나 다른 오류
        console.warn('Recognition may already be started');
      } else {
        if (this.onErrorCallback) {
          this.onErrorCallback('start-failed', '음성 인식 시작에 실패했습니다.');
        }
      }
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

  onError(callback: (error: string, message?: string) => void) {
    this.onErrorCallback = callback;
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

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
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

