-- Add created_by column to questions table to track ownership
ALTER TABLE public.questions 
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add created_by column to flashcards table as well (same issue exists)
ALTER TABLE public.flashcards 
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add created_by column to categories table
ALTER TABLE public.categories 
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop the overly permissive policies on questions table
DROP POLICY IF EXISTS "Authenticated users can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can update questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can delete questions" ON public.questions;

-- Create new ownership-based policies for questions
CREATE POLICY "Authenticated users can insert their own questions" 
ON public.questions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own questions" 
ON public.questions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own questions" 
ON public.questions 
FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);

-- Drop the overly permissive policies on flashcards table
DROP POLICY IF EXISTS "Authenticated users can insert flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Authenticated users can update flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Authenticated users can delete flashcards" ON public.flashcards;

-- Create new ownership-based policies for flashcards
CREATE POLICY "Authenticated users can insert their own flashcards" 
ON public.flashcards 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own flashcards" 
ON public.flashcards 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own flashcards" 
ON public.flashcards 
FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);

-- Drop the overly permissive policy on categories table
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;

-- Create ownership-based policy for categories
CREATE POLICY "Authenticated users can insert their own categories" 
ON public.categories 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);