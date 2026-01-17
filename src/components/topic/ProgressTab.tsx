import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Category, CategoryMastery } from '@/types';
import { BarChart3, Target, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProgressTabProps {
  categories: Category[];
  mastery: CategoryMastery[];
}

export function ProgressTab({ categories, mastery }: ProgressTabProps) {
  // Sort categories by mastery (weakest first)
  const sortedCategories = [...categories].sort((a, b) => {
    const aMastery = mastery.find(m => m.category_id === a.id)?.mastery_score || 0;
    const bMastery = mastery.find(m => m.category_id === b.id)?.mastery_score || 0;
    return aMastery - bMastery;
  });

  const getMasteryColorClass = (score: number) => {
    if (score < 40) return 'text-destructive';
    if (score < 70) return 'text-[hsl(45,100%,40%)]';
    return 'text-[hsl(142,70%,45%)]';
  };

  const getProgressColorClass = (score: number) => {
    if (score < 40) return '[&>div]:bg-destructive';
    if (score < 70) return '[&>div]:bg-[hsl(45,100%,50%)]';
    return '[&>div]:bg-[hsl(142,70%,45%)]';
  };

  // Calculate overall stats
  const totalAttempts = mastery.reduce((sum, m) => sum + m.attempts_count, 0);
  const avgMastery = mastery.length > 0
    ? Math.round(mastery.reduce((sum, m) => sum + m.mastery_score, 0) / mastery.length)
    : 0;
  const categoriesStudied = mastery.filter(m => m.attempts_count > 0).length;

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            No categories available. Import some content first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgMastery}%</p>
              <p className="text-sm text-muted-foreground">Avg Mastery</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalAttempts}</p>
              <p className="text-sm text-muted-foreground">Total Attempts</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categoriesStudied}/{categories.length}</p>
              <p className="text-sm text-muted-foreground">Categories Studied</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedCategories.map((category) => {
              const categoryMastery = mastery.find(m => m.category_id === category.id);
              const score = categoryMastery?.mastery_score || 0;
              const attempts = categoryMastery?.attempts_count || 0;
              const lastStudied = categoryMastery?.last_studied_at;
              const isOpenEndedReady = score >= 80 && attempts >= 10;

              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      {isOpenEndedReady && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(142,70%,95%)] text-[hsl(142,70%,35%)] border border-[hsl(142,70%,80%)]">
                          Open-ended ready
                        </span>
                      )}
                    </div>
                    <span className={`font-semibold ${getMasteryColorClass(score)}`}>
                      {score}%
                    </span>
                  </div>
                  <Progress 
                    value={score} 
                    className={`h-2 ${getProgressColorClass(score)}`} 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{attempts} attempts</span>
                    {lastStudied && (
                      <span>Last: {formatDistanceToNow(new Date(lastStudied))} ago</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
