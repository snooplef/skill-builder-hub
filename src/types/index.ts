export type TopicId = 'react' | 'javascript' | 'css' | 'html';

export interface Topic {
  id: TopicId;
  name: string;
  icon: string;
  color: string;
}

export interface Category {
  id: string;
  topic_id: TopicId;
  name: string;
}

export interface Question {
  id: string;
  topic_id: TopicId;
  category_id: string;
  type: 'mcq' | 'open';
  prompt: string;
  choices?: string[];
  correct_choice_index?: number;
  answer?: string;
  explanation?: string;
  difficulty?: number;
  tags?: string[];
}

export interface Flashcard {
  id: string;
  topic_id: TopicId;
  category_id: string;
  front: string;
  back: string;
  tags?: string[];
}

export interface CategoryMastery {
  id: string;
  user_id: string;
  topic_id: TopicId;
  category_id: string;
  mastery_score: number;
  attempts_count: number;
  rolling_accuracy: number;
  last_studied_at: string | null;
  category?: Category;
}

export interface Attempt {
  id: string;
  user_id: string;
  item_type: 'question' | 'flashcard';
  question_id?: string;
  flashcard_id?: string;
  result: 'correct' | 'wrong' | 'self_correct' | 'self_wrong' | 'dont_know';
  time_spent_seconds?: number;
  created_at: string;
}

export type QuizMode = 'specific' | 'mixed';
export type QuizFormat = 'adaptive' | 'mcq' | 'open';

export interface QuizSettings {
  mode: QuizMode;
  categories: string[];
  length: number;
  format: QuizFormat;
}
