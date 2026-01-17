import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Question, TopicId, Attempt } from '@/types';
import { Trophy, RotateCcw, X, CheckCircle, XCircle, HelpCircle, Timer, Flame, Zap } from 'lucide-react';

interface QuestionResult {
  question: Question;
  result: Attempt['result'];
  timeSpent: number;
}

interface QuizSummaryProps {
  results: QuestionResult[];
  topicId: TopicId;
  totalTime: number;
  bestStreak: number;
  onRetry: () => void;
  onClose: () => void;
}

export function QuizSummary({ results, topicId, totalTime, bestStreak, onRetry, onClose }: QuizSummaryProps) {
  const correctCount = results.filter(r => 
    r.result === 'correct' || r.result === 'self_correct'
  ).length;
  
  const accuracy = Math.round((correctCount / results.length) * 100);
  const avgTimePerQuestion = Math.round(totalTime / results.length);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

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
    if (accuracy >= 90) return { text: "Outstanding! You're crushing it!", emoji: "🎉" };
    if (accuracy >= 70) return { text: "Great job! Keep practicing!", emoji: "💪" };
    if (accuracy >= 50) return { text: "Good effort! Room for improvement.", emoji: "📚" };
    return { text: "Keep studying, you'll get there!", emoji: "🌱" };
  };

  const message = getScoreMessage();

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      {/* Summary Card */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Quiz Complete! {message.emoji}</CardTitle>
          <p className="text-muted-foreground">{message.text}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2">{accuracy}%</div>
            <p className="text-muted-foreground">
              {correctCount} of {results.length} correct
            </p>
          </div>

          <Progress value={accuracy} className="h-3" />

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Timer className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <div className="text-lg font-semibold">{formatTime(totalTime)}</div>
              <div className="text-xs text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Zap className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <div className="text-lg font-semibold">{formatTime(avgTimePerQuestion)}</div>
              <div className="text-xs text-muted-foreground">Avg per Q</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <Flame className="w-5 h-5 mx-auto mb-2 text-primary" />
              <div className="text-lg font-semibold">{bestStreak}</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
          </div>

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
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">
                  {index + 1}.
                </span>
                <p className="text-sm flex-1 line-clamp-2">{r.question.prompt}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{r.timeSpent}s</span>
                  {getResultIcon(r.result)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
