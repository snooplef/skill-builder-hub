import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileJson, FileUp, Eye, Copy, CheckCircle } from "lucide-react";

// Single category format
const exampleQuestionsSingle = {
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
      tags: ["hooks", "effects"],
    },
  ],
};

// Batch format (array of categories)
const exampleQuestionsBatch = [
  {
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
        tags: ["hooks", "effects"],
      },
    ],
  },
  {
    topic: "javascript",
    category: "Async",
    questions: [
      {
        id: "js-async-example-001",
        type: "open",
        prompt: "Explain the event loop.",
        answer: "The event loop coordinates the call stack, task queue, and microtask queue...",
        explanation: "It enables async behavior in single-threaded JavaScript.",
      },
    ],
  },
];

// Single category format
const exampleFlashcardsSingle = {
  topic: "javascript",
  category: "Async",
  flashcards: [
    {
      id: "js-async-example-001",
      front: "What is the event loop?",
      back: "A mechanism that coordinates the call stack, task queue, and microtask queue...",
    },
  ],
};

// Batch format (array of categories)
const exampleFlashcardsBatch = [
  {
    topic: "javascript",
    category: "Async",
    flashcards: [
      {
        id: "js-async-example-001",
        front: "What is the event loop?",
        back: "A mechanism that coordinates the call stack, task queue, and microtask queue...",
      },
    ],
  },
  {
    topic: "react",
    category: "Hooks",
    flashcards: [
      {
        id: "react-hooks-fc-001",
        front: "What does useState return?",
        back: "An array: [currentState, setStateFunction]",
      },
    ],
  },
];

export default function ContentLibrary() {
  const [jsonInput, setJsonInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState<"questions" | "flashcards" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      toast.success("File loaded! Review and import.");
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsText(file);
  };

  const copyExample = (type: "questions" | "flashcards", format: "single" | "batch") => {
    let example;
    if (type === "questions") {
      example = format === "single" ? exampleQuestionsSingle : exampleQuestionsBatch;
    } else {
      example = format === "single" ? exampleFlashcardsSingle : exampleFlashcardsBatch;
    }
    navigator.clipboard.writeText(JSON.stringify(example, null, 2));
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`Copied ${format} format to clipboard!`);
  };

  const importSingleCategory = async (
    data: any,
    type: "questions" | "flashcards",
  ): Promise<{ questions: number; flashcards: number }> => {
    const validTopics = ["react", "javascript", "css", "html"];
    if (!validTopics.includes(data.topic)) {
      throw new Error(`Invalid topic "${data.topic}". Must be: react, javascript, css, or html`);
    }
    if (!data.category) {
      throw new Error("Category is required");
    }

    // Upsert category
    const { data: catData, error: catError } = await supabase
      .from("categories")
      .upsert({ topic_id: data.topic, name: data.category }, { onConflict: "topic_id,name" })
      .select()
      .single();

    if (catError) throw catError;
    const categoryId = catData.id;

    let questionsCount = 0;
    let flashcardsCount = 0;

    if (type === "questions" && data.questions) {
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

      const { error } = await supabase.from("questions").upsert(questions, { onConflict: "id" });
      if (error) throw error;
      questionsCount = questions.length;
    } else if (type === "flashcards") {
      // Support both "cards" and "flashcards" keys
      const cardsData = data.flashcards || data.cards;
      if (cardsData) {
        const cards = cardsData.map((c: any) => ({
          id: c.id,
          topic_id: data.topic,
          category_id: categoryId,
          front: c.front,
          back: c.back,
          tags: c.tags || null,
        }));

        const { error } = await supabase.from("flashcards").upsert(cards, { onConflict: "id" });
        if (error) throw error;
        flashcardsCount = cards.length;
      }
    }

    return { questions: questionsCount, flashcards: flashcardsCount };
  };

  const validateAndImport = async (type: "questions" | "flashcards") => {
    try {
      setImporting(true);
      const data = JSON.parse(jsonInput);

      // Detect format: array (batch) or object (single category)
      const isBatch = Array.isArray(data);
      const categories = isBatch ? data : [data];

      let totalQuestions = 0;
      let totalFlashcards = 0;
      let categoriesProcessed = 0;

      for (const categoryData of categories) {
        const result = await importSingleCategory(categoryData, type);
        totalQuestions += result.questions;
        totalFlashcards += result.flashcards;
        categoriesProcessed++;
      }

      if (type === "questions") {
        toast.success(
          `Imported ${totalQuestions} questions from ${categoriesProcessed} ${categoriesProcessed === 1 ? "category" : "categories"}!`,
        );
      } else {
        toast.success(
          `Imported ${totalFlashcards} flashcards from ${categoriesProcessed} ${categoriesProcessed === 1 ? "category" : "categories"}!`,
        );
      }

      setJsonInput("");
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const ImportCard = ({ type }: { type: "questions" | "flashcards" }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            Import {type === "questions" ? "Questions" : "Flashcards"}
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Examples
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Example {type === "questions" ? "Questions" : "Flashcards"} JSON</DialogTitle>
                <DialogDescription>Supports single category or batch format (array of categories)</DialogDescription>
              </DialogHeader>

              {/* Single Category Format */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Single Category Format</h4>
                  <Button size="sm" variant="secondary" onClick={() => copyExample(type, "single")}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-auto max-h-48 font-mono">
                  {JSON.stringify(type === "questions" ? exampleQuestionsSingle : exampleFlashcardsSingle, null, 2)}
                </pre>
              </div>

              {/* Batch Format */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Batch Format (Multiple Categories)</h4>
                  <Button size="sm" variant="secondary" onClick={() => copyExample(type, "batch")}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-auto max-h-48 font-mono">
                  {JSON.stringify(type === "questions" ? exampleQuestionsBatch : exampleFlashcardsBatch, null, 2)}
                </pre>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Upload a JSON file or paste content directly. Supports single category or batch uploads.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileUpload} className="hidden" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
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
        <Button onClick={() => validateAndImport(type)} disabled={importing || !jsonInput} className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          {importing ? "Importing..." : `Import ${type === "questions" ? "Questions" : "Flashcards"}`}
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

      <Tabs defaultValue="questions" onValueChange={() => setJsonInput("")}>
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
