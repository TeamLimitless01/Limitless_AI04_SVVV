"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Download,
  FileText,
  Loader2,
  Upload
} from "lucide-react";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export default function SummarizeQuizPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<string>("");
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setSummary("");
      setQuiz([]);
      setShowResults(false);
      setSelectedAnswers([]);
      setCurrentQuestionIndex(0);
      toast.success("PDF file selected successfully!");
    } else {
      toast.error("Please select a valid PDF file.");
    }
  };

  const handleUploadAndSummarize = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF file first.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch("/api/summarize-quiz/process", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error("Failed to process PDF");
      }

      const result = await response.json();
      setSummary(result.summary);
      toast.success("PDF summarized successfully!");
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast.error("Failed to process PDF. Please try again.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownloadPDF = async () => {
    if (!summary) return;

    try {
      const doc = new jsPDF();
      
      // Set font and size
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      // Page settings
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      const topMargin = 20;
      const lineHeight = 15;
      
      const lines = doc.splitTextToSize(summary, maxWidth);
      
      let cursorY = topMargin;

      lines.forEach((line: string) => {
        if (cursorY + lineHeight > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
      });
      
      doc.save(`${selectedFile?.name.replace(".pdf", "") || "summary"}_AI_Summary.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

 

 

 
 
 
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl bg-black min-h-screen text-white">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          AI-Powered Summarize & Quiz
        </h1>
        <p className="text-gray-300 text-lg">
          Upload your PDF notes, get AI-powered summaries, and generate
          interactive quizzes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Upload className="h-5 w-5" />
              Upload PDF Notes
            </CardTitle>
            <CardDescription className="text-gray-400">
              Select a PDF file containing your study notes to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors bg-gray-800"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-blue-600" />
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="font-medium">Click to upload PDF</p>
                  <p className="text-sm text-gray-400">or drag and drop</p>
                </div>
              )}
            </div>

            {selectedFile && (
              <Button
                onClick={handleUploadAndSummarize}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Summarize PDF
                  </>
                )}
              </Button>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing PDF...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Section */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  AI Summary
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Get a concise summary of your PDF notes powered by AI
                </CardDescription>
              </div>
              {summary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none prose-invert">
                  <div className="bg-gray-800 p-6 rounded-lg text-gray-200 leading-relaxed border border-gray-700 shadow-xl">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold text-white mb-4">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold text-white mb-3">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-semibold text-white mb-2">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-3 text-gray-200">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-3 text-gray-200 space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-3 text-gray-200 space-y-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-gray-200">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-white font-semibold">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="text-gray-100 italic">{children}</em>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-700 px-2 py-1 rounded text-gray-100 text-sm">
                            {children}
                          </code>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {summary}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p>Upload and summarize a PDF to see the summary here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      
    </div>
  );
}
