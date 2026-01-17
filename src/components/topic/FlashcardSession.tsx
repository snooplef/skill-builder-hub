import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flashcard, TopicId } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { updateFlashcardProgress } from '@/hooks/useSpacedRepetition';
import { RotateCcw, CheckCircle, XCircle, Zap, Brain } from 'lucide-react';
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [results, setResults] = useState<('knew' | 'didnt_know')[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;
  const isComplete = currentIndex >= flashcards.length;

  const handleFlip = () => {
    if (!isTransitioning) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleResponse = async (knew: boolean) => {
    if (!user || isTransitioning) return;

    setIsTransitioning(true);

    // Log attempt
    await supabase.from('attempts').insert({
      user_id: user.id,
      item_type: 'flashcard',
      flashcard_id: currentCard.id,
      result: knew ? 'self_correct' : 'self_wrong',
    });

    // Update spaced repetition progress
    // SM-2 quality: 4 = knew it easily, 1 = didn't know
    const quality = knew ? 4 : 1;
    await updateFlashcardProgress(user.id, currentCard.id, quality);

    // Update streak
    if (knew) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
    } else {
      setStreak(0);
    }

    setResults([...results, knew ? 'knew' : 'didnt_know']);
    
    // Animate transition
    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        // Session complete
        setCurrentIndex(currentIndex + 1);
      }
      setIsTransitioning(false);
    }, 300);
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

            {/* Spaced repetition info */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Brain className="w-4 h-4 text-accent" />
              <span>Your progress is saved for spaced repetition</span>
            </div>

            {bestStreak > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Best streak: {bestStreak} cards!</span>
              </div>
            )}

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
      {/* Progress & Streak */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                <Zap className="w-3 h-3 mr-1" />
                {streak} streak
              </Badge>
            )}
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div 
        className={cn(
          "relative h-80 cursor-pointer perspective-1000 transition-all duration-300",
          isTransitioning && "opacity-50 scale-95"
        )}
        onClick={handleFlip}
      >
        <div 
          className="absolute inset-0 transition-transform duration-500"
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
      {isFlipped && !isTransitioning && (
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
            className="flex-1 bg-success hover:bg-success/90"
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