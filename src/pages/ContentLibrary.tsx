import { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileJson, FileUp, Eye, Copy, CheckCircle } from 'lucide-react';

const exampleQuestions = {
  topic: "react",
  category: "Hooks",
  questions: [
    {
      id: "react-hooks-example-001",
      type: "mcq",
      prompt: "What does useEffect run after by default?",
      choices: ["Every render", "Only on mount", "Only on unmount", "Only on state updates"],
      correctChoiceIndex: 0,
      explanation: "Without a dependency array, it runs after every render.",
      difficulty: 2,
      tags: ["hooks", "effects"]
    },
    {
      id: "react-hooks-example-002",
      type: "open",
      prompt: "Explain when you'd use useMemo vs useCallback.",
      answer: "useMemo memoizes a computed value; useCallback memoizes a function reference...",
      explanation: "Both help prevent unnecessary recomputation/rerenders when dependencies don't change."
    }
  ]
};

const exampleFlashcards = {
  topic: "javascript",
  category: "Async",
  cards: [
    {
      id: "js-async-example-001",
      front: "What is the event loop?",
      back: "A mechanism that coordinates the call stack, task queue, and microtask queue..."
    },
    {
      id: "js-async-example-002",
      front: "What is a Promise?",
      back: "An object representing the eventual completion or failure of an async operation."
    }
  ]
};

export default function ContentLibrary() {
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState<'questions' | 'flashcards' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      toast.success('File loaded! Review and import.');
    };
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsText(file);
  };

  const copyExample = (type: 'questions' | 'flashcards') => {
    const example = type === 'questions' ? exampleQuestions : exampleFlashcards;
    navigator.clipboard.writeText(JSON.stringify(example, null, 2));
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard!');
  };

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

  const ImportCard = ({ type }: { type: 'questions' | 'flashcards' }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            Import {type === 'questions' ? 'Questions' : 'Flashcards'}
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Example
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Example {type === 'questions' ? 'Questions' : 'Flashcards'} JSON</DialogTitle>
                <DialogDescription>
                  Copy this example and modify it with your own content
                </DialogDescription>
              </DialogHeader>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-auto max-h-96 font-mono">
                  {JSON.stringify(type === 'questions' ? exampleQuestions : exampleFlashcards, null, 2)}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => copyExample(type)}
                >
                  {copied === type ? (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  {copied === type ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Upload a JSON file or paste content directly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <FileUp className="w-4 h-4 mr-2" />
            Upload JSON File
          </Button>
        </div>

        {/* Paste Area */}
        <div className="relative">
          <Textarea
            placeholder={`Paste your ${type} JSON here...`}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        {/* Import Button */}
        <Button 
          onClick={() => validateAndImport(type)} 
          disabled={importing || !jsonInput}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {importing ? 'Importing...' : `Import ${type === 'questions' ? 'Questions' : 'Flashcards'}`}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Library</h1>
        <p className="text-muted-foreground mt-1">Import and manage questions and flashcards</p>
      </div>

      <Tabs defaultValue="questions" onValueChange={() => setJsonInput('')}>
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-6">
          <ImportCard type="questions" />
        </TabsContent>

        <TabsContent value="flashcards" className="mt-6">
          <ImportCard type="flashcards" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
