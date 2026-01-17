import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Category, Flashcard, TopicId } from '@/types';
import { Play, Layers } from 'lucide-react';
import { FlashcardSession } from './FlashcardSession';

interface FlashcardsTabProps {
  topicId: TopicId;
  categories: Category[];
  flashcards: Flashcard[];
}

export function FlashcardsTab({ topicId, categories, flashcards }: FlashcardsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sessionSize, setSessionSize] = useState('10');
  const [activeSession, setActiveSession] = useState<Flashcard[] | null>(null);

  const startSession = () => {
    let eligibleCards = [...flashcards];
    
    if (selectedCategory !== 'all') {
      eligibleCards = eligibleCards.filter(f => f.category_id === selectedCategory);
    }

    // Shuffle
    eligibleCards.sort(() => Math.random() - 0.5);

    // Take session size
    const size = parseInt(sessionSize);
    const sessionCards = eligibleCards.slice(0, size);

    if (sessionCards.length > 0) {
      setActiveSession(sessionCards);
    }
  };

  if (activeSession) {
    return (
      <FlashcardSession 
        flashcards={activeSession}
        topicId={topicId}
        onComplete={() => setActiveSession(null)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Flashcards Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Session Size */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Cards per Session</Label>
          <Select value={sessionSize} onValueChange={setSessionSize}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 cards</SelectItem>
              <SelectItem value="10">10 cards</SelectItem>
              <SelectItem value="20">20 cards</SelectItem>
              <SelectItem value="50">50 cards</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {flashcards.length} flashcards available
            {selectedCategory !== 'all' && ` (${flashcards.filter(f => f.category_id === selectedCategory).length} in selected category)`}
          </p>
        </div>

        {/* Start Button */}
        <Button 
          onClick={startSession}
          size="lg"
          disabled={flashcards.length === 0}
        >
          <Play className="w-4 h-4 mr-2" />
          Start Session
        </Button>

        {flashcards.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No flashcards available. Import some content first.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
