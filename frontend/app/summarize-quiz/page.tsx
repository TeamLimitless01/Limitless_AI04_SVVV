"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Brain, PlayCircle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

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

  const handleGenerateQuiz = async () => {
    if (!summary) {
      toast.error("Please summarize the PDF first.");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/summarize-quiz/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ summary }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }

      const result = await response.json();
      setQuiz(result.questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers([]);
      setShowResults(false);
      toast.success("Quiz generated successfully!");
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateScore();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    quiz.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        score++;
      }
    });
    setQuizScore(score);
    setShowResults(true);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setQuizScore(0);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl bg-black min-h-screen text-white">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          AI-Powered Summarize & Quiz
        </h1>
        <p className="text-gray-300 text-lg">
          Upload your PDF notes, get AI-powered summaries, and generate interactive quizzes
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
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5" />
              AI Summary
            </CardTitle>
            <CardDescription className="text-gray-400">
              Get a concise summary of your PDF notes powered by AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none prose-invert">
                  <div className="bg-gray-800 p-6 rounded-lg text-gray-200 leading-relaxed">
                    <ReactMarkdown
                      components={{
                        h1: ({children}) => <h1 className="text-xl font-bold text-white mb-4">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-semibold text-white mb-3">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-semibold text-white mb-2">{children}</h3>,
                        p: ({children}) => <p className="mb-3 text-gray-200">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-3 text-gray-200 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-3 text-gray-200 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-gray-200">{children}</li>,
                        strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                        em: ({children}) => <em className="text-gray-100 italic">{children}</em>,
                        code: ({children}) => <code className="bg-gray-700 px-2 py-1 rounded text-gray-100 text-sm">{children}</code>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300">{children}</blockquote>,
                      }}
                    >
                      {summary}
                    </ReactMarkdown>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateQuiz}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Generate Quiz
                    </>
                  )}
                </Button>
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

      {/* Quiz Section */}
      {quiz.length > 0 && (
        <Card className="mt-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Brain className="h-5 w-5" />
              Interactive Quiz
            </CardTitle>
            <CardDescription className="text-gray-400">
              Test your knowledge with questions generated from your notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showResults ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white">
                    Question {currentQuestionIndex + 1} of {quiz.length}
                  </span>
                  <div className="flex gap-1">
                    {quiz.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentQuestionIndex
                            ? "bg-blue-600"
                            : selectedAnswers[index] !== undefined
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {quiz[currentQuestionIndex].question}
                  </h3>
                  <div className="space-y-2">
                    {quiz[currentQuestionIndex].options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAnswers[currentQuestionIndex] === index
                            ? "border-blue-500 bg-blue-900"
                            : "border-gray-600 bg-gray-800 hover:border-gray-500"
                        }`}
                        onClick={() => handleAnswerSelect(index)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 ${
                              selectedAnswers[currentQuestionIndex] === index
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedAnswers[currentQuestionIndex] === index && (
                              <div className="w-full h-full rounded-full bg-white scale-50" />
                            )}
                          </div>
                          <span className="text-white">{option}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleNextQuestion}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                  >
                    {currentQuestionIndex === quiz.length - 1 ? "Finish" : "Next"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <CheckCircle className="h-16 w-16 mx-auto text-green-400" />
                  <h3 className="text-2xl font-bold text-white">Quiz Completed!</h3>
                  <p className="text-lg text-white">
                    Your Score: {quizScore} out of {quiz.length}
                  </p>
                  <div className="text-sm text-gray-300">
                    {quizScore === quiz.length
                      ? "Perfect! You mastered all the concepts."
                      : quizScore >= quiz.length * 0.7
                      ? "Great job! You have a good understanding."
                      : quizScore >= quiz.length * 0.5
                      ? "Good effort! Review the concepts you missed."
                      : "Keep practicing! Review the material and try again."}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-white">Review Your Answers:</h4>
                  {quiz.map((question, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        selectedAnswers[index] === question.correctAnswer
                          ? "bg-green-900 border-green-700"
                          : "bg-red-900 border-red-700"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {selectedAnswers[index] === question.correctAnswer ? (
                          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                        )}
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm text-white">{question.question}</p>
                          <p className="text-sm text-gray-300 mt-1">
                            Your answer: {question.options[selectedAnswers[index]]}
                          </p>
                          {selectedAnswers[index] !== question.correctAnswer && (
                            <p className="text-sm text-green-400 mt-1">
                              Correct answer: {question.options[question.correctAnswer]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={resetQuiz} className="w-full">
                  Retake Quiz
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
