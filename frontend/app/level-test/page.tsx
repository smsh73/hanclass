'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VoiceRecorder from '@/components/VoiceRecorder';

interface Question {
  id: number;
  question: string;
  type: string;
  level: string;
  options?: string[];
  correctAnswer?: string;
}

export default function LevelTestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/level-test/questions`);
      const data = await response.json();
      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 세션에서 userId 가져오기
      const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') : null;
      let userId: number | null = null;
      
      if (sessionId) {
        try {
          const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/session/${sessionId}`);
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            userId = userData.user.id;
          }
        } catch (error) {
          console.error('Failed to get user from session:', error);
        }
      }

      if (!userId) {
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        router.push('/');
        return;
      }

      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer,
        type: questions.find((q) => q.id === parseInt(questionId))?.type || 'reading',
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/level-test/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, answers: answerArray }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '테스트 제출에 실패했습니다.' }));
        throw new Error(errorData.message || '테스트 제출에 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        setResult(data.result);
      } else {
        throw new Error(data.message || '테스트 제출에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to submit test:', error);
      const errorMessage = error instanceof Error ? error.message : '테스트 제출에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTranscript = (text: string, isFinal: boolean) => {
    if (isFinal && !isAISpeaking) {
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion?.type === 'speaking') {
        handleAnswer(currentQuestion.id, text);
        setTranscript('');
      }
    } else {
      setTranscript(text);
    }
  };

  if (isLoading) {
    return <div className="p-8">로딩 중...</div>;
  }

  if (result) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">레벨 테스트 결과</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <p className="text-lg">점수: {result.score}점</p>
            <p className="text-lg">레벨: {result.level}</p>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">세부 점수</h2>
            <ul>
              <li>읽기: {result.details.reading}점</li>
              <li>듣기: {result.details.listening}점</li>
              <li>말하기: {result.details.speaking}점</li>
              <li>쓰기: {result.details.writing}점</li>
            </ul>
          </div>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">레벨 테스트</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            문제 {currentQuestionIndex + 1} / {questions.length}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">{currentQuestion?.question}</h2>

          {currentQuestion?.type === 'speaking' && (
            <div className="mb-4">
              <VoiceRecorder
                onTranscript={handleTranscript}
                isEnabled={true}
                isAISpeaking={isAISpeaking}
              />
              {transcript && (
                <p className="mt-2 text-gray-700">인식된 텍스트: {transcript}</p>
              )}
              {answers[currentQuestion.id] && (
                <p className="mt-2 text-green-600">
                  답변: {answers[currentQuestion.id]}
                </p>
              )}
            </div>
          )}

          {currentQuestion?.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(currentQuestion.id, option)}
                  className={`w-full text-left p-3 rounded border ${
                    answers[currentQuestion.id] === option
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
          >
            이전
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              {isSubmitting ? '제출 중...' : '제출'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              다음
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

