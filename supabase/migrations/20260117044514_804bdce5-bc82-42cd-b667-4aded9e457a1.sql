-- Add spaced repetition fields to flashcards table
ALTER TABLE public.flashcards 
ADD COLUMN IF NOT EXISTS ease_factor double precision DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS interval_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS repetitions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_review_at timestamp with time zone DEFAULT now();

-- Create user_flashcard_progress table for per-user spaced repetition data
CREATE TABLE IF NOT EXISTS public.user_flashcard_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  flashcard_id TEXT NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  ease_factor double precision NOT NULL DEFAULT 2.5,
  interval_days integer NOT NULL DEFAULT 0,
  repetitions integer NOT NULL DEFAULT 0,
  next_review_at timestamp with time zone NOT NULL DEFAULT now(),
  last_reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, flashcard_id)
);

-- Enable RLS on user_flashcard_progress
ALTER TABLE public.user_flashcard_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_flashcard_progress
CREATE POLICY "Users can view their own flashcard progress"
ON public.user_flashcard_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcard progress"
ON public.user_flashcard_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcard progress"
ON public.user_flashcard_progress
FOR UPDATE
USING (auth.uid() = user_id);