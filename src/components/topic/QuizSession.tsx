import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Question, TopicId, CategoryMastery, QuizFormat, Attempt } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, ArrowRight, HelpCircle } from 'lucide-react';
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
}

export function QuizSession({ questions, topicId, mastery, format, onComplete }: QuizSessionProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Determine if this MCQ or open-ended based on adaptive logic
  const shouldBeOpenEnded = () => {
    if (format === 'mcq') return false;
    if (format === 'open') return true;
    
    // Adaptive logic
    const categoryMastery = mastery.find(m => m.category_id === currentQuestion.category_id);
    const masteryScore = categoryMastery?.mastery_score || 0;
    const attemptsCount = categoryMastery?.attempts_count || 0;

    if (masteryScore > 80 && attemptsCount >= 10) {
      return Math.random() > 0.2; // 80% open-ended
    } else if (masteryScore > 60) {
      return Math.random() > 0.5; // 50% open-ended
    } else {
      return Math.random() > 0.9; // 10% open-ended
    }
  };

  const isOpenEnded = currentQuestion.type === 'open' || (currentQuestion.type === 'mcq' && shouldBeOpenEnded());

  const logAttempt = async (result: Attempt['result']) => {
    if (!user) return;

    await supabase.from('attempts').insert({
      user_id: user.id,
      item_type: 'question',
      question_id: currentQuestion.id,
      result,
    });

    setResults([...results, { question: currentQuestion, result }]);
  };

  const handleMCQSubmit = async () => {
    if (selectedChoice === null) return;
    
    const isCorrect = selectedChoice === currentQuestion.correct_choice_index;
    await logAttempt(isCorrect ? 'correct' : 'wrong');
    setShowAnswer(true);
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
      setCurrentIndex(currentIndex + 1);
      setSelectedChoice(null);
      setOpenAnswer('');
      setShowAnswer(false);
    } else {
      // Quiz complete - results already logged
    }
  };

  // Show summary if quiz is complete
  if (currentIndex >= questions.length - 1 && showAnswer && results.length === questions.length) {
    return (
      <QuizSummary 
        results={results}
        topicId={topicId}
        onRetry={onComplete}
        onClose={onComplete}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium leading-relaxed">
            {currentQuestion.prompt}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* MCQ Choices */}
          {!isOpenEnded && currentQuestion.choices && (
            <div className="space-y-2">
              {currentQuestion.choices.map((choice, index) => {
                const isSelected = selectedChoice === index;
                const isCorrect = index === currentQuestion.correct_choice_index;
                
                let choiceClass = 'border-border hover:border-primary/50 hover:bg-muted/50';
                if (showAnswer) {
                  if (isCorrect) {
                    choiceClass = 'border-[hsl(142,70%,45%)] bg-[hsl(142,70%,95%)]';
                  } else if (isSelected && !isCorrect) {
                    choiceClass = 'border-destructive bg-destructive/10';
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
                      'w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3',
                      choiceClass
                    )}
                  >
                    <span className="w-6 h-6 rounded-full border flex items-center justify-center text-sm font-medium shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{choice}</span>
                    {showAnswer && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-[hsl(142,70%,45%)]" />
                    )}
                    {showAnswer && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-destructive" />
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
              className="resize-none"
            />
          )}

          {/* Explanation */}
          {showAnswer && (
            <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
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
              <Button onClick={goToNext}>
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
              <>
                <Button 
                  variant="outline"
                  onClick={() => handleSelfGrade(true)}
                  className="border-[hsl(142,70%,45%)] text-[hsl(142,70%,35%)] hover:bg-[hsl(142,70%,95%)]"
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
              </>
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
