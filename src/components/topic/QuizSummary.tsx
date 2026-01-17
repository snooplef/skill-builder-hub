import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Question, TopicId, Attempt } from '@/types';
import { Trophy, RotateCcw, X, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

interface QuestionResult {
  question: Question;
  result: Attempt['result'];
}

interface QuizSummaryProps {
  results: QuestionResult[];
  topicId: TopicId;
  onRetry: () => void;
  onClose: () => void;
}

export function QuizSummary({ results, topicId, onRetry, onClose }: QuizSummaryProps) {
  const correctCount = results.filter(r => 
    r.result === 'correct' || r.result === 'self_correct'
  ).length;
  
  const accuracy = Math.round((correctCount / results.length) * 100);

  // Group by category
  const categoryBreakdown = results.reduce((acc, r) => {
    const catId = r.question.category_id;
    if (!acc[catId]) {
      acc[catId] = { correct: 0, total: 0 };
    }
    acc[catId].total++;
    if (r.result === 'correct' || r.result === 'self_correct') {
      acc[catId].correct++;
    }
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  const getResultIcon = (result: Attempt['result']) => {
    switch (result) {
      case 'correct':
      case 'self_correct':
        return <CheckCircle className="w-4 h-4 text-[hsl(142,70%,45%)]" />;
      case 'wrong':
      case 'self_wrong':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'dont_know':
        return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getScoreMessage = () => {
    if (accuracy >= 90) return "Outstanding! You're crushing it!";
    if (accuracy >= 70) return "Great job! Keep practicing!";
    if (accuracy >= 50) return "Good effort! Room for improvement.";
    return "Keep studying, you'll get there!";
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      {/* Summary Card */}
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <p className="text-muted-foreground">{getScoreMessage()}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">{accuracy}%</div>
            <p className="text-muted-foreground">
              {correctCount} of {results.length} correct
            </p>
          </div>

          <Progress value={accuracy} className="h-3" />

          {/* Category Breakdown */}
          {Object.keys(categoryBreakdown).length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">By Category</p>
              <div className="space-y-1">
                {Object.entries(categoryBreakdown).map(([catId, data]) => {
                  const catAccuracy = Math.round((data.correct / data.total) * 100);
                  return (
                    <div key={catId} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm truncate flex-1">{catId.slice(0, 8)}...</span>
                      <span className="text-sm font-medium">{catAccuracy}% ({data.correct}/{data.total})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={onRetry} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              New Quiz
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {results.map((r, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">
                  {index + 1}.
                </span>
                <p className="text-sm flex-1 line-clamp-2">{r.question.prompt}</p>
                {getResultIcon(r.result)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
