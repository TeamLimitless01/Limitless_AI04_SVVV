import { NextRequest, NextResponse } from "next/server";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { summary } = await request.json();

    if (!summary) {
      return NextResponse.json(
        { error: "No summary provided" },
        { status: 400 }
      );
    }

    // Generate quiz questions based on the summary
    // In a real implementation, you would use an AI service to generate these
    // For now, we'll create mock questions based on common topics
    const questions: QuizQuestion[] = [
      {
        question: "What is the primary purpose of document processing with AI?",
        options: [
          "To make documents searchable and accessible",
          "To reduce file size",
          "To change document format",
          "To print documents faster"
        ],
        correctAnswer: 0,
        explanation: "AI document processing primarily aims to make content searchable and accessible while maintaining structure."
      },
      {
        question: "Which language model is commonly used for processing English documents in India?",
        options: [
          "en-US",
          "en-GB",
          "en-IN",
          "en-AU"
        ],
        correctAnswer: 2,
        explanation: "en-IN is the language code for English as used in India."
      },
      {
        question: "What format can Sarvam AI output processed documents in?",
        options: [
          "PDF only",
          "Word only",
          "HTML format",
          "Plain text only"
        ],
        correctAnswer: 2,
        explanation: "Sarvam AI can output processed documents in HTML format among other options."
      },
      {
        question: "What is a key benefit of AI-powered summarization?",
        options: [
          "Increases document length",
          "Makes documents harder to read",
          "Provides concise understanding of content",
          "Changes the original meaning"
        ],
        correctAnswer: 2,
        explanation: "AI summarization provides concise understanding while preserving key information."
      },
      {
        question: "How does document intelligence help with learning?",
        options: [
          "By making content interactive",
          "By extracting key concepts",
          "By generating practice questions",
          "All of the above"
        ],
        correctAnswer: 3,
        explanation: "Document intelligence helps learning through multiple approaches including interactivity, concept extraction, and question generation."
      }
    ];

    // Shuffle the questions to make it more interesting
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      success: true,
      questions: shuffledQuestions,
    });

  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate quiz",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
