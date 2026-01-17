import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Category, CategoryMastery, TopicId, Question, Flashcard } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { QuizTab } from '@/components/topic/QuizTab';
import { FlashcardsTab } from '@/components/topic/FlashcardsTab';
import { ProgressTab } from '@/components/topic/ProgressTab';
import { QuestionBrowserTab } from '@/components/topic/QuestionBrowserTab';
import { Atom, FileCode, Palette, Code, BookOpen } from 'lucide-react';

const topicMeta: Record<TopicId, { name: string; icon: typeof Atom; color: string }> = {
  react: { name: 'React', icon: Atom, color: 'bg-topic-react' },
  javascript: { name: 'JavaScript', icon: FileCode, color: 'bg-topic-javascript' },
  css: { name: 'CSS', icon: Palette, color: 'bg-topic-css' },
  html: { name: 'HTML', icon: Code, color: 'bg-topic-html' },
};

export default function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const location = useLocation();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [mastery, setMastery] = useState<CategoryMastery[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataKey, setDataKey] = useState(0);

  const defaultTab = searchParams.get('tab') || 'quiz';
  const validTopicId = (topicId && topicId in topicMeta) ? topicId as TopicId : 'react';
  const meta = topicMeta[validTopicId];
  const Icon = meta.icon;

  const fetchData = useCallback(async () => {
    if (!user || !topicId) return;
    
    setLoading(true);
    
    try {
      // Fetch categories for this topic
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('topic_id', topicId);

      // Fetch mastery for this topic
      const { data: masteryData } = await supabase
        .from('category_mastery')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', topicId);

      // Fetch questions for this topic
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topicId);

      // Fetch flashcards for this topic
      const { data: flashcardsData } = await supabase
        .from('flashcards')
        .select('*')
        .eq('topic_id', topicId);

      if (categoriesData) setCategories(categoriesData as Category[]);
      
      if (masteryData && categoriesData) {
        const enriched = masteryData.map((m) => ({
          ...m,
          category: categoriesData.find((c) => c.id === m.category_id),
        })) as CategoryMastery[];
        setMastery(enriched);
      } else {
        setMastery([]);
      }

      if (questionsData) setQuestions(questionsData as Question[]);
      if (flashcardsData) setFlashcards(flashcardsData as Flashcard[]);

    } catch (error) {
      console.error('Error fetching topic data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, topicId]);

  // Refetch data when topicId changes - this ensures fresh data when navigating between topics
  useEffect(() => {
    setCategories([]);
    setMastery([]);
    setQuestions([]);
    setFlashcards([]);
    setDataKey(prev => prev + 1);
    fetchData();
  }, [topicId, fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div key={`${validTopicId}-${dataKey}`} className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${meta.color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{meta.name}</h1>
          <p className="text-muted-foreground">
            {questions.length} questions · {flashcards.length} flashcards · {categories.length} categories
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="reference">Reference</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="quiz" className="mt-6">
          <QuizTab 
            key={`quiz-${validTopicId}-${dataKey}`}
            topicId={validTopicId}
            categories={categories}
            questions={questions}
            mastery={mastery}
          />
        </TabsContent>

        <TabsContent value="flashcards" className="mt-6">
          <FlashcardsTab 
            key={`flashcards-${validTopicId}-${dataKey}`}
            topicId={validTopicId}
            categories={categories}
            flashcards={flashcards}
          />
        </TabsContent>

        <TabsContent value="reference" className="mt-6">
          <QuestionBrowserTab 
            key={`reference-${validTopicId}-${dataKey}`}
            categories={categories}
            questions={questions}
          />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <ProgressTab 
            key={`progress-${validTopicId}-${dataKey}`}
            categories={categories}
            mastery={mastery}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}