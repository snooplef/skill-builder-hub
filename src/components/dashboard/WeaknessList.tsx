import { forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { CategoryMastery, TopicId } from '@/types';

const topicLabels: Record<TopicId, string> = {
  react: 'React',
  javascript: 'JavaScript',
  css: 'CSS',
  html: 'HTML',
};

interface WeaknessListProps {
  masteryData: CategoryMastery[];
}

export const WeaknessList = forwardRef<HTMLDivElement, WeaknessListProps>(
  ({ masteryData }, ref) => {
    // Get all categories sorted by mastery score
    const sortedWeaknesses = [...masteryData]
      .sort((a, b) => a.mastery_score - b.mastery_score)
      .slice(0, 8);

    const getMasteryColorClass = (score: number) => {
      if (score < 40) return 'bg-destructive/10 text-destructive border-destructive/20';
      if (score < 70) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      return 'bg-success/10 text-success border-success/20';
    };

    if (sortedWeaknesses.length === 0) {
      return (
        <Card ref={ref}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-primary" />
              Weakest Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start practicing to see your weak areas here.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card ref={ref}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-4 h-4 text-primary" />
            Weakest Categories Overall
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedWeaknesses.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {topicLabels[item.topic_id as TopicId]}
                  </span>
                  <span className="text-sm font-medium">
                    {item.category?.name || 'Unknown Category'}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getMasteryColorClass(item.mastery_score)}`}>
                  {item.mastery_score}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
);

WeaknessList.displayName = 'WeaknessList';