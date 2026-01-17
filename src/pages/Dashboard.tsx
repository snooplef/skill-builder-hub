import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TopicCard } from '@/components/dashboard/TopicCard';
import { WeaknessList } from '@/components/dashboard/WeaknessList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CategoryMastery, TopicId, Category } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Atom, FileCode, Palette, Code, TrendingUp, Zap, BookOpen, ArrowRight } from 'lucide-react';

const topics: { id: TopicId; name: string; icon: typeof Atom; color: string }[] = [
  { id: 'react', name: 'React', icon: Atom, color: 'bg-topic-react' },
  { id: 'javascript', name: 'JavaScript', icon: FileCode, color: 'bg-topic-javascript' },
  { id: 'css', name: 'CSS', icon: Palette, color: 'bg-topic-css' },
  { id: 'html', name: 'HTML', icon: Code, color: 'bg-topic-html' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [masteryData, setMasteryData] = useState<CategoryMastery[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*');

        // Fetch mastery data
        const { data: masteryDataResult } = await supabase
          .from('category_mastery')
          .select('*')
          .eq('user_id', user.id);

        if (categoriesData) {
          setCategories(categoriesData as Category[]);
        }

        if (masteryDataResult) {
          // Attach category info to mastery data
          const enrichedMastery = masteryDataResult.map((m) => ({
            ...m,
            category: categoriesData?.find((c) => c.id === m.category_id),
          })) as CategoryMastery[];
          setMasteryData(enrichedMastery);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const getMasteryForTopic = (topicId: TopicId) => {
    return masteryData.filter((m) => m.topic_id === topicId);
  };

  // Calculate overall stats
  const totalAttempts = masteryData.reduce((sum, m) => sum + m.attempts_count, 0);
  const overallMastery = masteryData.length > 0
    ? Math.round(masteryData.reduce((sum, m) => sum + m.mastery_score, 0) / masteryData.length)
    : 0;
  const topicsWithProgress = topics.filter(t => getMasteryForTopic(t.id).length > 0).length;

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Your frontend interview preparation journey
          </p>
        </div>
        <Button asChild>
          <Link to="/library">
            <BookOpen className="w-4 h-4 mr-2" />
            Content Library
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold">{overallMastery}%</p>
              <p className="text-sm text-muted-foreground">Overall Mastery</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-3xl font-bold">{totalAttempts}</p>
              <p className="text-sm text-muted-foreground">Total Attempts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted to-muted/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-foreground/70" />
            </div>
            <div>
              <p className="text-3xl font-bold">{topicsWithProgress}/{topics.length}</p>
              <p className="text-sm text-muted-foreground">Topics Started</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topic Progress Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Topic Progress</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {topics.map((topic) => {
            const topicMastery = getMasteryForTopic(topic.id);
            const mastery = topicMastery.length > 0
              ? Math.round(topicMastery.reduce((sum, m) => sum + m.mastery_score, 0) / topicMastery.length)
              : 0;
            const Icon = topic.icon;

            return (
              <Link key={topic.id} to={`/topic/${topic.id}`} className="block group">
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${topic.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{topic.name}</p>
                        <p className="text-xs text-muted-foreground">{topicMastery.length} categories</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Mastery</span>
                        <span className="font-semibold">{mastery}%</span>
                      </div>
                      <Progress value={mastery} className="h-2" />
                    </div>
                    <div className="flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Study now</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Detailed Cards & Weakness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Detailed Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topicId={topic.id}
                name={topic.name}
                masteryData={getMasteryForTopic(topic.id)}
              />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Focus Areas</h2>
          <WeaknessList masteryData={masteryData} />
        </div>
      </div>
    </div>
  );
}