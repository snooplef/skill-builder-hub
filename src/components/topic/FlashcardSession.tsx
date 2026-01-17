import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flashcard, TopicId } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RotateCcw, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashcardSessionProps {
  flashcards: Flashcard[];
  topicId: TopicId;
  onComplete: () => void;
}

export function FlashcardSession({ flashcards, topicId, onComplete }: FlashcardSessionProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<('knew' | 'didnt_know')[]>([]);

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;
  const isComplete = currentIndex >= flashcards.length;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResponse = async (knew: boolean) => {
    if (!user) return;

    // Log attempt
    await supabase.from('attempts').insert({
      user_id: user.id,
      item_type: 'flashcard',
      flashcard_id: currentCard.id,
      result: knew ? 'self_correct' : 'self_wrong',
    });

    setResults([...results, knew ? 'knew' : 'didnt_know']);
    
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // Session complete
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Summary screen
  if (isComplete) {
    const knewCount = results.filter(r => r === 'knew').length;
    const accuracy = Math.round((knewCount / results.length) * 100);

    return (
      <div className="space-y-6 max-w-lg mx-auto animate-fade-in">
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
              <p className="text-muted-foreground">
                You reviewed {flashcards.length} cards
              </p>
            </div>
            
            <div className="text-4xl font-bold text-primary">{accuracy}%</div>
            <p className="text-sm text-muted-foreground">
              {knewCount} of {results.length} cards known
            </p>

            <Progress value={accuracy} className="h-2" />

            <div className="flex gap-3 pt-4">
              <Button onClick={onComplete} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Session
              </Button>
              <Button variant="outline" onClick={onComplete} className="flex-1">
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div 
        className="relative h-80 cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <div 
          className={cn(
            "absolute inset-0 transition-transform duration-500 transform-style-preserve-3d",
            isFlipped && "rotate-y-180"
          )}
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front */}
          <Card 
            className="absolute inset-0 flex items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Question
              </p>
              <p className="text-xl font-medium leading-relaxed">
                {currentCard.front}
              </p>
              <p className="text-sm text-muted-foreground mt-6">
                Click to flip
              </p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card 
            className="absolute inset-0 flex items-center justify-center p-8 bg-primary/5"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <CardContent className="text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Answer
              </p>
              <p className="text-lg leading-relaxed">
                {currentCard.back}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Response Buttons */}
      {isFlipped && (
        <div className="flex gap-3 animate-fade-in">
          <Button 
            variant="outline"
            onClick={() => handleResponse(false)}
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Didn't Know
          </Button>
          <Button 
            onClick={() => handleResponse(true)}
            className="flex-1 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)]"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Knew It
          </Button>
        </div>
      )}

      {!isFlipped && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={onComplete}>
            Exit Session
          </Button>
        </div>
      )}
    </div>
  );
}
