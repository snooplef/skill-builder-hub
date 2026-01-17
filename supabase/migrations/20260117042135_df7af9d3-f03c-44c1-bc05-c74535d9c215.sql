-- Topics table (static data)
CREATE TABLE public.topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seed topics
INSERT INTO public.topics (id, name, icon, color) VALUES
    ('react', 'React', 'atom', 'blue'),
    ('javascript', 'JavaScript', 'file-code', 'yellow'),
    ('css', 'CSS', 'palette', 'pink'),
    ('html', 'HTML', 'code', 'orange');

-- Categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(topic_id, name)
);

-- Questions table
CREATE TABLE public.questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('mcq', 'open')),
    prompt TEXT NOT NULL,
    choices JSONB,
    correct_choice_index INTEGER,
    answer TEXT,
    explanation TEXT,
    difficulty INTEGER,
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Flashcards table
CREATE TABLE public.flashcards (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Attempts table (user-specific)
CREATE TABLE public.attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('question', 'flashcard')),
    question_id TEXT REFERENCES public.questions(id) ON DELETE CASCADE,
    flashcard_id TEXT REFERENCES public.flashcards(id) ON DELETE CASCADE,
    result TEXT NOT NULL CHECK (result IN ('correct', 'wrong', 'self_correct', 'self_wrong', 'dont_know')),
    time_spent_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Category mastery table (user-specific)
CREATE TABLE public.category_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    mastery_score INTEGER NOT NULL DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
    attempts_count INTEGER NOT NULL DEFAULT 0,
    rolling_accuracy FLOAT DEFAULT 0,
    last_studied_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, category_id)
);

-- Profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all user-specific tables
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attempts
CREATE POLICY "Users can view their own attempts"
    ON public.attempts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attempts"
    ON public.attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for category_mastery
CREATE POLICY "Users can view their own mastery"
    ON public.category_mastery FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mastery"
    ON public.category_mastery FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mastery"
    ON public.category_mastery FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Public read access for topics, categories, questions, flashcards
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topics"
    ON public.topics FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view categories"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view questions"
    ON public.questions FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view flashcards"
    ON public.flashcards FOR SELECT
    USING (true);

-- Authenticated users can insert content (for importing)
CREATE POLICY "Authenticated users can insert categories"
    ON public.categories FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can insert questions"
    ON public.questions FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can insert flashcards"
    ON public.flashcards FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update questions"
    ON public.questions FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can update flashcards"
    ON public.flashcards FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete questions"
    ON public.questions FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete flashcards"
    ON public.flashcards FOR DELETE
    TO authenticated
    USING (true);

-- Function to update mastery on attempt
CREATE OR REPLACE FUNCTION public.update_mastery_on_attempt()
RETURNS TRIGGER AS $$
DECLARE
    delta INTEGER;
    current_mastery INTEGER;
    new_mastery INTEGER;
    cat_id UUID;
    top_id TEXT;
BEGIN
    -- Determine category and topic from the question or flashcard
    IF NEW.item_type = 'question' THEN
        SELECT category_id, topic_id INTO cat_id, top_id FROM public.questions WHERE id = NEW.question_id;
    ELSE
        SELECT category_id, topic_id INTO cat_id, top_id FROM public.flashcards WHERE id = NEW.flashcard_id;
    END IF;

    -- Calculate delta based on result
    CASE NEW.result
        WHEN 'correct' THEN delta := 3;
        WHEN 'self_correct' THEN delta := 3;
        WHEN 'wrong' THEN delta := -2;
        WHEN 'self_wrong' THEN delta := -2;
        WHEN 'dont_know' THEN delta := -4;
        ELSE delta := 0;
    END CASE;

    -- Upsert category_mastery
    INSERT INTO public.category_mastery (user_id, topic_id, category_id, mastery_score, attempts_count, last_studied_at)
    VALUES (NEW.user_id, top_id, cat_id, GREATEST(0, LEAST(100, 50 + delta)), 1, now())
    ON CONFLICT (user_id, category_id)
    DO UPDATE SET
        mastery_score = GREATEST(0, LEAST(100, public.category_mastery.mastery_score + delta)),
        attempts_count = public.category_mastery.attempts_count + 1,
        last_studied_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for mastery updates
CREATE TRIGGER trigger_update_mastery
    AFTER INSERT ON public.attempts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_mastery_on_attempt();

-- Function to update profile timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();