import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Question, TopicId } from '@/types';

export function useWrongAnswers(topicId: TopicId, allQuestions: Question[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wrong-answers', topicId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all wrong attempts for this topic's questions
      const questionIds = allQuestions.map(q => q.id);
      
      if (questionIds.length === 0) return [];

      // Get the most recent attempt for each question
      const { data: attempts, error } = await supabase
        .from('attempts')
        .select('question_id, result, created_at')
        .eq('user_id', user.id)
        .eq('item_type', 'question')
        .in('question_id', questionIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by question_id and get the most recent attempt
      const latestAttempts = new Map<string, { result: string; created_at: string }>();
      
      for (const attempt of attempts || []) {
        if (attempt.question_id && !latestAttempts.has(attempt.question_id)) {
          latestAttempts.set(attempt.question_id, {
            result: attempt.result,
            created_at: attempt.created_at,
          });
        }
      }

      // Filter questions where the most recent attempt was wrong
      const wrongQuestionIds = Array.from(latestAttempts.entries())
        .filter(([_, attempt]) => 
          attempt.result === 'wrong' || 
          attempt.result === 'self_wrong' || 
          attempt.result === 'dont_know'
        )
        .map(([questionId]) => questionId);

      // Return the actual question objects
      return allQuestions.filter(q => wrongQuestionIds.includes(q.id));
    },
    enabled: !!user && allQuestions.length > 0,
  });
}
