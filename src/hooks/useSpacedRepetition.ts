import { supabase } from '@/integrations/supabase/client';

// SM-2 Algorithm Implementation
// Quality: 0-5 (0-2 = wrong, 3-5 = correct with varying difficulty)

interface FlashcardProgress {
  id: string;
  user_id: string;
  flashcard_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_reviewed_at: string | null;
}

export function calculateNextReview(
  quality: number, // 0-5 scale
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetitions: number
): { easeFactor: number; interval: number; repetitions: number; nextReviewAt: Date } {
  // SM-2 algorithm
  let newEaseFactor = currentEaseFactor;
  let newInterval = currentInterval;
  let newRepetitions = currentRepetitions;

  if (quality >= 3) {
    // Correct response
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * currentEaseFactor);
    }
    newRepetitions += 1;
  } else {
    // Incorrect response - reset
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Minimum ease factor is 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt,
  };
}

export async function getFlashcardProgress(
  userId: string,
  flashcardId: string
): Promise<FlashcardProgress | null> {
  const { data, error } = await supabase
    .from('user_flashcard_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('flashcard_id', flashcardId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching flashcard progress:', error);
    return null;
  }

  return data;
}

export async function updateFlashcardProgress(
  userId: string,
  flashcardId: string,
  quality: number // 0-5 scale, simplified: knew = 4, didn't know = 1
): Promise<void> {
  // Get current progress or use defaults
  const currentProgress = await getFlashcardProgress(userId, flashcardId);
  
  const currentEaseFactor = currentProgress?.ease_factor ?? 2.5;
  const currentInterval = currentProgress?.interval_days ?? 0;
  const currentRepetitions = currentProgress?.repetitions ?? 0;

  const { easeFactor, interval, repetitions, nextReviewAt } = calculateNextReview(
    quality,
    currentEaseFactor,
    currentInterval,
    currentRepetitions
  );

  const { error } = await supabase
    .from('user_flashcard_progress')
    .upsert({
      user_id: userId,
      flashcard_id: flashcardId,
      ease_factor: easeFactor,
      interval_days: interval,
      repetitions: repetitions,
      next_review_at: nextReviewAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,flashcard_id' });

  if (error) {
    console.error('Error updating flashcard progress:', error);
  }
}

export async function getCardsForReview(
  userId: string,
  topicId: string,
  categoryIds: string[],
  limit: number = 10
): Promise<string[]> {
  // Get all flashcards for the topic/categories
  let query = supabase
    .from('flashcards')
    .select('id')
    .eq('topic_id', topicId);

  if (categoryIds.length > 0) {
    query = query.in('category_id', categoryIds);
  }

  const { data: flashcards, error: flashcardsError } = await query;

  if (flashcardsError || !flashcards) {
    console.error('Error fetching flashcards:', flashcardsError);
    return [];
  }

  const flashcardIds = flashcards.map(f => f.id);

  // Get progress for these flashcards
  const { data: progress, error: progressError } = await supabase
    .from('user_flashcard_progress')
    .select('*')
    .eq('user_id', userId)
    .in('flashcard_id', flashcardIds);

  if (progressError) {
    console.error('Error fetching progress:', progressError);
  }

  const progressMap = new Map(
    (progress || []).map(p => [p.flashcard_id, p])
  );

  const now = new Date();

  // Score each card: lower score = higher priority
  const scoredCards = flashcardIds.map(id => {
    const p = progressMap.get(id);
    
    if (!p) {
      // New card - highest priority (score 0)
      return { id, score: 0 };
    }

    const nextReview = new Date(p.next_review_at);
    const daysOverdue = (now.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysOverdue > 0) {
      // Overdue - priority based on how overdue (negative score = more overdue)
      return { id, score: -daysOverdue };
    } else {
      // Not due yet - lower priority
      return { id, score: 1000 - daysOverdue };
    }
  });

  // Sort by score (lowest first) and take limit
  scoredCards.sort((a, b) => a.score - b.score);
  
  return scoredCards.slice(0, limit).map(c => c.id);
}