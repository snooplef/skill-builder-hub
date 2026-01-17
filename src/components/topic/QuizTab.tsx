import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Category, CategoryMastery, Question, TopicId, QuizMode, QuizFormat } from '@/types';
import { Play, Shuffle, Target, RotateCcw } from 'lucide-react';
import { QuizSession } from './QuizSession';
import { useWrongAnswers } from '@/hooks/useWrongAnswers';

interface QuizTabProps {
  topicId: TopicId;
  categories: Category[];
  questions: Question[];
  mastery: CategoryMastery[];
}

export function QuizTab({ topicId, categories, questions, mastery }: QuizTabProps) {
  const [mode, setMode] = useState<QuizMode>('mixed');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [quizLength, setQuizLength] = useState('10');
  const [format, setFormat] = useState<QuizFormat>('adaptive');
  const [activeQuiz, setActiveQuiz] = useState<Question[] | null>(null);
  
  const { data: wrongAnswers = [], isLoading: isLoadingWrongAnswers, refetch: refetchWrongAnswers } = useWrongAnswers(topicId, questions);

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    }
  };

  const generateQuiz = () => {
    let eligibleQuestions = [...questions];
    
    // Filter by category if in specific mode
    if (mode === 'specific' && selectedCategories.length > 0) {
      eligibleQuestions = eligibleQuestions.filter(q => 
        selectedCategories.includes(q.category_id)
      );
    } else if (mode === 'mixed' && selectedCategories.length > 0) {
      eligibleQuestions = eligibleQuestions.filter(q => 
        selectedCategories.includes(q.category_id)
      );
    }

    // Apply adaptive weighting based on mastery
    if (format === 'adaptive') {
      eligibleQuestions = eligibleQuestions.map(q => {
        const categoryMastery = mastery.find(m => m.category_id === q.category_id);
        const masteryScore = categoryMastery?.mastery_score || 50;
        const weight = 1 + (100 - masteryScore) / 25;
        return { ...q, weight };
      });

      // Sort by weight and shuffle within weight groups
      eligibleQuestions.sort((a, b) => (b as any).weight - (a as any).weight);
    } else {
      // Random shuffle
      eligibleQuestions.sort(() => Math.random() - 0.5);
    }

    // Filter by format preference
    if (format === 'mcq') {
      eligibleQuestions = eligibleQuestions.filter(q => q.type === 'mcq');
    } else if (format === 'open') {
      eligibleQuestions = eligibleQuestions.filter(q => q.type === 'open');
    }

    // Take the requested number
    const length = parseInt(quizLength);
    const quizQuestions = eligibleQuestions.slice(0, length);

    if (quizQuestions.length === 0) {
      return;
    }

    setActiveQuiz(quizQuestions);
  };

  const handleQuizComplete = () => {
    setActiveQuiz(null);
    // Refetch wrong answers after quiz completion
    refetchWrongAnswers();
  };

  const startReviewWrongAnswers = () => {
    if (wrongAnswers.length === 0) return;
    
    // Shuffle the wrong answers
    const shuffled = [...wrongAnswers].sort(() => Math.random() - 0.5);
    setActiveQuiz(shuffled);
  };

  if (activeQuiz) {
    return (
      <QuizSession 
        questions={activeQuiz}
        topicId={topicId}
        mastery={mastery}
        format={format}
        onComplete={handleQuizComplete}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Wrong Answers Card */}
      {wrongAnswers.length > 0 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-accent" />
                <CardTitle className="text-base">Review Wrong Answers</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                {wrongAnswers.length} {wrongAnswers.length === 1 ? 'question' : 'questions'}
              </Badge>
            </div>
            <CardDescription>
              Practice questions you got wrong in previous quizzes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button 
              onClick={startReviewWrongAnswers}
              variant="outline"
              className="border-accent text-accent hover:bg-accent/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Review ({wrongAnswers.length})
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Quiz Setup
          </CardTitle>
          <CardDescription>
            Configure your quiz settings and start practicing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quiz Mode</Label>
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as QuizMode)} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mixed" id="mixed" />
              <Label htmlFor="mixed" className="font-normal cursor-pointer">
                Mixed Across Categories
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="specific" id="specific" />
              <Label htmlFor="specific" className="font-normal cursor-pointer">
                Specific Category
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Category Selection */}
        {categories.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {mode === 'specific' ? 'Select Category' : 'Select Categories (optional)'}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map((category) => {
                const categoryMastery = mastery.find(m => m.category_id === category.id);
                const masteryScore = categoryMastery?.mastery_score || 0;
                
                return (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) => 
                        handleCategoryToggle(category.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={category.id} 
                      className="flex-1 text-sm font-normal cursor-pointer flex justify-between"
                    >
                      <span>{category.name}</span>
                      <span className="text-muted-foreground">{masteryScore}%</span>
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quiz Length */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quiz Length</Label>
          <Select value={quizLength} onValueChange={setQuizLength}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 questions</SelectItem>
              <SelectItem value="10">10 questions</SelectItem>
              <SelectItem value="20">20 questions</SelectItem>
              <SelectItem value="50">50 questions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Format Preference */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Question Format</Label>
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as QuizFormat)} className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="adaptive" id="adaptive" />
              <Label htmlFor="adaptive" className="font-normal cursor-pointer">
                <span className="flex items-center gap-1">
                  <Shuffle className="w-3.5 h-3.5" />
                  Adaptive
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mcq" id="mcq" />
              <Label htmlFor="mcq" className="font-normal cursor-pointer">MCQ Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="open" id="open-format" />
              <Label htmlFor="open-format" className="font-normal cursor-pointer">Open-ended Only</Label>
            </div>
          </RadioGroup>
        </div>

          {/* Start Button */}
          <div className="pt-4">
            <Button 
              onClick={generateQuiz} 
              size="lg"
              disabled={questions.length === 0}
              className="w-full sm:w-auto"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Quiz
            </Button>
            {questions.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No questions available. Import some content first.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
