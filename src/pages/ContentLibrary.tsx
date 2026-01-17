import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileJson, CheckCircle, AlertCircle } from 'lucide-react';

export default function ContentLibrary() {
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);

  const validateAndImport = async (type: 'questions' | 'flashcards') => {
    try {
      setImporting(true);
      const data = JSON.parse(jsonInput);
      
      const validTopics = ['react', 'javascript', 'css', 'html'];
      if (!validTopics.includes(data.topic)) {
        throw new Error('Invalid topic. Must be: react, javascript, css, or html');
      }
      if (!data.category) {
        throw new Error('Category is required');
      }

      // Upsert category
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .upsert({ topic_id: data.topic, name: data.category }, { onConflict: 'topic_id,name' })
        .select()
        .single();

      if (catError) throw catError;
      const categoryId = catData.id;

      if (type === 'questions' && data.questions) {
        const questions = data.questions.map((q: any) => ({
          id: q.id,
          topic_id: data.topic,
          category_id: categoryId,
          type: q.type,
          prompt: q.prompt,
          choices: q.choices || null,
          correct_choice_index: q.correctChoiceIndex ?? null,
          answer: q.answer || null,
          explanation: q.explanation || null,
          difficulty: q.difficulty || null,
          tags: q.tags || null,
        }));

        const { error } = await supabase.from('questions').upsert(questions, { onConflict: 'id' });
        if (error) throw error;
        toast.success(`Imported ${questions.length} questions!`);
      } else if (type === 'flashcards' && data.cards) {
        const cards = data.cards.map((c: any) => ({
          id: c.id,
          topic_id: data.topic,
          category_id: categoryId,
          front: c.front,
          back: c.back,
          tags: c.tags || null,
        }));

        const { error } = await supabase.from('flashcards').upsert(cards, { onConflict: 'id' });
        if (error) throw error;
        toast.success(`Imported ${cards.length} flashcards!`);
      }

      setJsonInput('');
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Library</h1>
        <p className="text-muted-foreground mt-1">Import and manage questions and flashcards</p>
      </div>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                Import Questions
              </CardTitle>
              <CardDescription>Paste JSON to import questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder='{"topic": "react", "category": "Hooks", "questions": [...]}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <Button onClick={() => validateAndImport('questions')} disabled={importing || !jsonInput}>
                <Upload className="w-4 h-4 mr-2" />
                Import Questions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flashcards" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                Import Flashcards
              </CardTitle>
              <CardDescription>Paste JSON to import flashcards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder='{"topic": "javascript", "category": "Async", "cards": [...]}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <Button onClick={() => validateAndImport('flashcards')} disabled={importing || !jsonInput}>
                <Upload className="w-4 h-4 mr-2" />
                Import Flashcards
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
