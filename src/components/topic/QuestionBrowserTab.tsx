import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Category, Question } from '@/types';
import { BookOpen, Search, CheckCircle } from 'lucide-react';

interface QuestionBrowserTabProps {
  categories: Category[];
  questions: Question[];
}

export function QuestionBrowserTab({ categories, questions }: QuestionBrowserTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(q => q.category_id === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.prompt.toLowerCase().includes(query) ||
        q.answer?.toLowerCase().includes(query) ||
        q.explanation?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [questions, selectedCategory, searchQuery]);

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const getQuestionsByCategory = () => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredQuestions };
    }

    // Group by category
    const grouped: Record<string, Question[]> = {};
    for (const question of filteredQuestions) {
      if (!grouped[question.category_id]) {
        grouped[question.category_id] = [];
      }
      grouped[question.category_id].push(question);
    }
    return grouped;
  };

  const groupedQuestions = getQuestionsByCategory();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Question Reference
        </CardTitle>
        <CardDescription>
          Browse all questions and answers by category
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {filteredQuestions.length} {filteredQuestions.length === 1 ? 'question' : 'questions'} found
        </p>

        {/* Questions grouped by category */}
        {Object.entries(groupedQuestions).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No questions match your filters
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedQuestions).map(([categoryId, categoryQuestions]) => (
              <div key={categoryId} className="space-y-2">
                {selectedCategory === 'all' && (
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-medium text-sm">{getCategoryName(categoryId)}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {categoryQuestions.length}
                    </Badge>
                  </div>
                )}
                
                <Accordion type="multiple" className="space-y-2">
                  {categoryQuestions.map((question, index) => (
                    <AccordionItem
                      key={question.id}
                      value={question.id}
                      className="border rounded-lg px-4 bg-card hover:bg-muted/30 transition-colors"
                    >
                      <AccordionTrigger className="text-left py-4 hover:no-underline">
                        <div className="flex items-start gap-3 pr-4">
                          <span className="text-muted-foreground text-sm font-mono shrink-0">
                            {index + 1}.
                          </span>
                          <span className="text-sm">{question.prompt}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="pl-7 space-y-3">
                          {/* MCQ Choices */}
                          {question.type === 'mcq' && question.choices && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Choices
                              </p>
                              <div className="space-y-1">
                                {(question.choices as string[]).map((choice, i) => (
                                  <div
                                    key={i}
                                    className={`flex items-center gap-2 text-sm p-2 rounded ${
                                      i === question.correct_choice_index
                                        ? 'bg-[hsl(var(--correct-bg))] text-[hsl(var(--correct))]'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    <span className="font-mono text-xs">
                                      {String.fromCharCode(65 + i)}.
                                    </span>
                                    <span className="flex-1">{choice}</span>
                                    {i === question.correct_choice_index && (
                                      <CheckCircle className="w-4 h-4 shrink-0" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Answer */}
                          {question.answer && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Answer
                              </p>
                              <p className="text-sm bg-muted/50 p-3 rounded-lg">
                                {question.answer}
                              </p>
                            </div>
                          )}

                          {/* Explanation */}
                          {question.explanation && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Explanation
                              </p>
                              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                {question.explanation}
                              </p>
                            </div>
                          )}

                          {/* Meta info */}
                          <div className="flex gap-2 pt-2">
                            <Badge variant="outline" className="text-xs">
                              {question.type === 'mcq' ? 'Multiple Choice' : 'Open-ended'}
                            </Badge>
                            {question.difficulty && (
                              <Badge variant="outline" className="text-xs">
                                Difficulty: {question.difficulty}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
