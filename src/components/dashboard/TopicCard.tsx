import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Atom, FileCode, Palette, Code, Clock } from 'lucide-react';
import { TopicId, CategoryMastery } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const topicIcons: Record<TopicId, typeof Atom> = {
  react: Atom,
  javascript: FileCode,
  css: Palette,
  html: Code,
};

const topicColors: Record<TopicId, string> = {
  react: 'bg-[hsl(200,100%,50%)]',
  javascript: 'bg-[hsl(45,100%,50%)]',
  css: 'bg-[hsl(320,70%,55%)]',
  html: 'bg-[hsl(15,100%,55%)]',
};

interface TopicCardProps {
  topicId: TopicId;
  name: string;
  masteryData: CategoryMastery[];
}

export function TopicCard({ topicId, name, masteryData }: TopicCardProps) {
  const Icon = topicIcons[topicId];
  const colorClass = topicColors[topicId];
  
  // Calculate overall mastery for this topic
  const overallMastery = masteryData.length > 0
    ? Math.round(masteryData.reduce((sum, m) => sum + m.mastery_score, 0) / masteryData.length)
    : 0;

  // Get last studied date
  const lastStudied = masteryData
    .filter(m => m.last_studied_at)
    .sort((a, b) => new Date(b.last_studied_at!).getTime() - new Date(a.last_studied_at!).getTime())[0];

  // Get weakest categories
  const weakestCategories = [...masteryData]
    .sort((a, b) => a.mastery_score - b.mastery_score)
    .slice(0, 3);

  const getMasteryColorClass = (score: number) => {
    if (score < 40) return 'text-destructive';
    if (score < 70) return 'text-[hsl(45,100%,40%)]';
    return 'text-[hsl(142,70%,45%)]';
  };

  return (
    <Card className="card-hover group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-lg">{name}</CardTitle>
          </div>
          <span className={`text-2xl font-bold ${getMasteryColorClass(overallMastery)}`}>
            {overallMastery}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mastery</span>
            <span className="font-medium">{overallMastery}%</span>
          </div>
          <Progress value={overallMastery} className="h-2" />
        </div>

        {lastStudied && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Last studied {formatDistanceToNow(new Date(lastStudied.last_studied_at!))} ago</span>
          </div>
        )}

        {weakestCategories.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Weakest Areas</p>
            <div className="flex flex-wrap gap-1.5">
              {weakestCategories.map((cat) => (
                <span 
                  key={cat.id} 
                  className="text-xs px-2 py-1 bg-muted rounded-md"
                >
                  {cat.category?.name || 'Unknown'} ({cat.mastery_score}%)
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={`/topic/${topicId}`}>
              View Topic
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <Link to={`/topic/${topicId}?tab=quiz&recommended=true`}>
              Start Quiz
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
