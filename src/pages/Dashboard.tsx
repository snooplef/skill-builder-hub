import { useEffect, useState } from 'react';
import { TopicCard } from '@/components/dashboard/TopicCard';
import { WeaknessList } from '@/components/dashboard/WeaknessList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CategoryMastery, TopicId, Category } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const topics: { id: TopicId; name: string }[] = [
  { id: 'react', name: 'React' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'css', name: 'CSS' },
  { id: 'html', name: 'HTML' },
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

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track your progress across frontend interview topics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topicId={topic.id}
            name={topic.name}
            masteryData={getMasteryForTopic(topic.id)}
          />
        ))}
      </div>

      <WeaknessList masteryData={masteryData} />
    </div>
  );
}
