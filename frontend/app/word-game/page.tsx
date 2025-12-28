'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VoiceRecorder from '@/components/VoiceRecorder';

interface Word {
  id: number;
  word: string;
  difficulty: number;
  level: string;
}

export default function WordGamePage() {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    fetchWords();
  }, []);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isPlaying && timeLeft === 0) {
      handleTimeUp();
    }
  }, [isPlaying, timeLeft]);

  const fetchWords = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/word-game/words?limit=100`
      );
      const data = await response.json();
      if (data.success) {
        setWords(data.words);
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    setCurrentWordIndex(0);
    setScore(0);
    setTimeLeft(5);
    setUserAnswer('');
  };

  const handleAnswer = async (answer: string) => {
    if (!isPlaying) return;

    const currentWord = words[currentWordIndex];
    if (!currentWord) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/word-game/check`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: currentWord.word,
            userAnswer: answer,
          }),
        }
      );

      const data = await response.json();
      if (data.success && data.correct) {
        setScore(score + 1);
      }

      // Move to next word
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
        setTimeLeft(5);
        setUserAnswer('');
        setTranscript('');
      } else {
        // Game over
        endGame();
      }
    } catch (error) {
      console.error('Failed to check answer:', error);
    }
  };

  const handleTimeUp = () => {
    // Time's up, move to next word
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setTimeLeft(5);
      setUserAnswer('');
      setTranscript('');
    } else {
      endGame();
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameResult({
      score,
      totalWords: words.length,
      percentage: Math.round((score / words.length) * 100),
    });
  };

  const handleTranscript = (text: string, isFinal: boolean) => {
    if (isFinal && !isAISpeaking && isPlaying) {
      setUserAnswer(text);
      handleAnswer(text);
      setTranscript('');
    } else {
      setTranscript(text);
    }
  };

  if (gameResult) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">게임 결과</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <p className="text-4xl font-bold mb-4">{gameResult.score} / {gameResult.totalWords}</p>
            <p className="text-2xl mb-6">정답률: {gameResult.percentage}%</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setGameResult(null);
                  startGame();
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                다시 하기
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">단어 맞추기 게임</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="mb-4">규칙:</p>
          <ul className="list-disc list-inside mb-6">
            <li>화면에 나타나는 한글 단어를 음성으로 말하세요</li>
            <li>각 단어마다 5초의 시간이 주어집니다</li>
            <li>1분에 10단어, 총 100문제입니다</li>
          </ul>
          <button
            onClick={startGame}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-lg"
          >
            게임 시작
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentWordIndex];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">단어 맞추기</h1>
        <div className="text-right">
          <p>점수: {score}</p>
          <p>남은 시간: {timeLeft}초</p>
          <p>문제 {currentWordIndex + 1} / {words.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center mb-8">
          <p className="text-6xl font-bold mb-4">{currentWord?.word}</p>
        </div>

        <div className="mb-6">
          <VoiceRecorder
            onTranscript={handleTranscript}
            isEnabled={isPlaying}
            isAISpeaking={isAISpeaking}
          />
          {transcript && (
            <p className="mt-2 text-gray-700">인식된 텍스트: {transcript}</p>
          )}
          {userAnswer && (
            <p className="mt-2 text-green-600">답변: {userAnswer}</p>
          )}
        </div>
      </div>
    </div>
  );
}

