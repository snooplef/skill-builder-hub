import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Question, TopicId, CategoryMastery, QuizFormat, Attempt } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, ArrowRight, HelpCircle, Timer, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuizSummary } from './QuizSummary';

interface QuizSessionProps {
  questions: Question[];
  topicId: TopicId;
  mastery: CategoryMastery[];
  format: QuizFormat;
  onComplete: () => void;
}

interface QuestionResult {
  question: Question;
  result: Attempt['result'];
  timeSpent: number;
}

export function QuizSession({ questions, topicId, mastery, format, onComplete }: QuizSessionProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef(Date.now());

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Timer effect - stops when quiz is complete
  useEffect(() => {
    if (quizComplete) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizComplete]);

  // Reset timer for each question
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine if this MCQ or open-ended based on adaptive logic
  const shouldBeOpenEnded = () => {
    if (format === 'mcq') return false;
    if (format === 'open') return true;
    
    // Adaptive logic
    const categoryMastery = mastery.find(m => m.category_id === currentQuestion.category_id);
    const masteryScore = categoryMastery?.mastery_score || 0;
    const attemptsCount = categoryMastery?.attempts_count || 0;

    if (masteryScore > 80 && attemptsCount >= 10) {
      return Math.random() > 0.2;
    } else if (masteryScore > 60) {
      return Math.random() > 0.5;
    } else {
      return Math.random() > 0.9;
    }
  };

  const isOpenEnded = currentQuestion.type === 'open' || (currentQuestion.type === 'mcq' && shouldBeOpenEnded());

  const logAttempt = async (result: Attempt['result']) => {
    if (!user) return;

    const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000);

    await supabase.from('attempts').insert({
      user_id: user.id,
      item_type: 'question',
      question_id: currentQuestion.id,
      result,
      time_spent_seconds: timeSpent,
    });

    // Update streak
    const isCorrect = result === 'correct' || result === 'self_correct';
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
    } else {
      setStreak(0);
    }

    setResults([...results, { question: currentQuestion, result, timeSpent }]);
  };

  const handleMCQSubmit = async () => {
    if (selectedChoice === null) return;
    
    const isCorrect = selectedChoice === currentQuestion.correct_choice_index;
    await logAttempt(isCorrect ? 'correct' : 'wrong');
    setShowAnswer(true);
    
    // If last question, mark quiz complete to stop timer
    if (currentIndex === questions.length - 1) {
      setQuizComplete(true);
    }
  };

  const handleOpenSubmit = () => {
    setShowAnswer(true);
  };

  const handleDontKnow = async () => {
    await logAttempt('dont_know');
    setShowAnswer(true);
  };

  const handleSelfGrade = async (correct: boolean) => {
    await logAttempt(correct ? 'self_correct' : 'self_wrong');
    goToNext();
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setSelectedChoice(null);
        setOpenAnswer('');
        setShowAnswer(false);
        setIsTransitioning(false);
      }, 200);
    } else {
      // Last question - mark quiz as complete to stop timer
      setQuizComplete(true);
    }
  };

  // Show summary if quiz is complete (all questions answered)
  if (quizComplete && results.length === questions.length) {
    return (
      <QuizSummary 
        results={results}
        topicId={topicId}
        totalTime={timeElapsed}
        bestStreak={bestStreak}
        onRetry={onComplete}
        onClose={onComplete}
      />
    );
  }

  return (
    <div className={cn(
      "space-y-6 max-w-2xl transition-all duration-200",
      isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
    )}>
      {/* Progress Header with Timer and Streak */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-4">
            {/* Streak */}
            {streak > 0 && (
              <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 animate-fade-in">
                <Flame className="w-3 h-3 mr-1" />
                {streak} streak
              </Badge>
            )}
            {/* Timer */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Timer className="w-4 h-4" />
              <span className="text-sm font-mono">{formatTime(timeElapsed)}</span>
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg font-medium leading-relaxed">
            {currentQuestion.prompt}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* MCQ Choices */}
          {!isOpenEnded && currentQuestion.choices && (
            <div className="space-y-2">
              {(currentQuestion.choices as string[]).map((choice, index) => {
                const isSelected = selectedChoice === index;
                const isCorrect = index === currentQuestion.correct_choice_index;
                
                let choiceClass = 'border-border hover:border-primary/50 hover:bg-muted/50';
                if (showAnswer) {
                  if (isCorrect) {
                    choiceClass = 'border-[hsl(var(--correct))] bg-[hsl(var(--correct-bg))] scale-[1.02] text-[hsl(var(--correct))]';
                  } else if (isSelected && !isCorrect) {
                    choiceClass = 'border-[hsl(var(--wrong))] bg-[hsl(var(--wrong-bg))] text-[hsl(var(--wrong))]';
                  }
                } else if (isSelected) {
                  choiceClass = 'border-primary bg-primary/5';
                }

                return (
                  <button
                    key={index}
                    onClick={() => !showAnswer && setSelectedChoice(index)}
                    disabled={showAnswer}
                    className={cn(
                      'w-full p-4 rounded-lg border text-left transition-all duration-200 flex items-center gap-3',
                      choiceClass
                    )}
                  >
                    <span className="w-6 h-6 rounded-full border flex items-center justify-center text-sm font-medium shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{choice}</span>
                    {showAnswer && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--correct))] animate-scale-in" />
                    )}
                    {showAnswer && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-[hsl(var(--wrong))] animate-scale-in" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Open-ended Input */}
          {isOpenEnded && !showAnswer && (
            <Textarea
              placeholder="Type your answer here..."
              value={openAnswer}
              onChange={(e) => setOpenAnswer(e.target.value)}
              rows={5}
              className="resize-none transition-all focus:ring-2 focus:ring-primary/20"
            />
          )}

          {/* Explanation */}
          {showAnswer && (
            <div className="p-4 rounded-lg bg-muted/50 border space-y-3 animate-fade-in">
              {currentQuestion.answer && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Reference Answer</p>
                  <p className="text-sm">{currentQuestion.answer}</p>
                </div>
              )}
              {currentQuestion.explanation && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Explanation</p>
                  <p className="text-sm">{currentQuestion.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {!showAnswer && !isOpenEnded && (
              <Button 
                onClick={handleMCQSubmit}
                disabled={selectedChoice === null}
              >
                Submit Answer
              </Button>
            )}

            {!showAnswer && isOpenEnded && (
              <>
                <Button onClick={handleOpenSubmit}>
                  Submit Answer
                </Button>
                <Button variant="outline" onClick={handleDontKnow}>
                  <HelpCircle className="w-4 h-4 mr-2" />
                  I Don't Know
                </Button>
              </>
            )}

            {showAnswer && !isOpenEnded && (
              <Button onClick={() => {
                if (currentIndex < questions.length - 1) {
                  goToNext();
                } else {
                  setQuizComplete(true);
                }
              }} className="animate-fade-in">
                {currentIndex < questions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  'See Results'
                )}
              </Button>
            )}

            {showAnswer && isOpenEnded && (
              <div className="flex gap-3 animate-fade-in">
                <Button 
                  variant="outline"
                  onClick={() => handleSelfGrade(true)}
                  className="border-success text-success hover:bg-success/10"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I Got It Right
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleSelfGrade(false)}
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  I Got It Wrong
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exit Quiz */}
      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={onComplete}>
          Exit Quiz
        </Button>
      </div>
    </div>
  );
}