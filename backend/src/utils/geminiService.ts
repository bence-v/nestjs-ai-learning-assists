import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Difficulty } from '@prisma/client';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error(
    'FATAL ERROR: GEMINI_API_KEY is not set in the environment variables.',
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

export interface Flashcard {
  question: string;
  answer: string;
  difficulty: Difficulty;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
}

export interface DocumentChunk {
  content: string;
}

/**
 * Generate flashcards from text
 */
const generateFlashcards = async (
  text: string,
  count: number = 10,
): Promise<Flashcard[]> => {
  const prompt = `Generate exactly ${count} educational flashcards from the following text. Format each flashcard as:
            Q: [Clear, specific question]
            A: [Concise, accurate answer]
            D: [Difficulty level: easy, medium, or hard]
            Separate each flashcard with "-----"
            Text:
            ${text.substring(0, 15000)}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text();

    const flashcards: Flashcard[] = [];
    const cards = generatedText.split('-----').filter((c) => c.trim());

    for (const card of cards) {
      const lines = card.trim().split('\n');
      let question = '',
        answer = '',
        difficulty = 'medium' as Difficulty;

      for (const line of lines) {
        if (line.startsWith('Q:')) {
          question = line.substring(2).trim();
        } else if (line.startsWith('A:')) {
          answer = line.substring(2).trim();
        } else if (line.startsWith('D:')) {
          const diff = line.substring(2).trim().toLowerCase();
          if (['easy', 'medium', 'hard'].includes(diff)) {
            difficulty = diff as Difficulty;
          }
        }
      }

      if (question && answer) {
        flashcards.push({ question, answer, difficulty });
      }
    }

    return flashcards.slice(0, count);
  } catch (error) {
    console.log('Gemini API error', error);
    throw new Error('Failed to generate flashcards');
  }
};

/**
 * Generate quiz questions
 */
const generateQuiz = async (
  text: string,
  numQuestions: number = 5,
): Promise<QuizQuestion[]> => {
  const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.
            Format each question as:
            Q: [Question]
            01: [Option 1]
            02: [Option 2]
            03: [Option 3]
            04: [Option 4]
            C: [Correct option - exactly as written above]
            E: [Brief explanation]
            D: [Difficulty: easy, medium, or hard]
            
            Separate questions with "___"
            
            Text:
            ${text.substring(0, 15000)}`;
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text();

    const questions: QuizQuestion[] = [];
    const questionBlocks = generatedText.split('___').filter((q) => q.trim());

    for (const block of questionBlocks) {
      const lines = block.trim().split('\n');
      let question = '',
        options: string[] = [],
        correctAnswer = '',
        explanation = '',
        difficulty = 'medium';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('Q:')) {
          question = trimmed.substring(2).trim();
        } else if (trimmed.match(/^0\d:/)) {
          options.push(trimmed.substring(3).trim());
        } else if (trimmed.startsWith('C:')) {
          correctAnswer = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('E:')) {
          explanation = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('D:')) {
          const diff = trimmed.substring(2).trim().toLowerCase();
          if (['easy', 'medium', 'hard'].includes(diff)) {
            difficulty = diff;
          }
        }
      }

      if (question && options.length === 4 && correctAnswer) {
        questions.push({
          question,
          options,
          correctAnswer,
          explanation,
          difficulty,
        });
      }
    }

    return questions.slice(0, numQuestions);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate quiz');
  }
};

/**
 * Generate document summary
 */
const generateSummary = async (text: string): Promise<string> => {
  const prompt = `Provide a concise summary of the following text, highlighting the key concepts, main ideas and important points.
    Keep the summary clear and structured
    Text:
    ${text.substring(0, 20000)}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text();
    return generatedText;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate summary');
  }
};

/**
 * Chat with document context
 */
const chatWithContext = async (
  question: string,
  chunks: DocumentChunk[],
): Promise<string> => {
  const context = chunks
    .map((c, i) => `[Chunk ${i + 1}]\n${c.content}`)
    .join('\n\n');

  const prompt = `Based on the following context from a document, Analyse the context and answer the user's question 
     If the answer is not in the context, say so.
                
    Context:
    ${context}
    
    Question: ${question}
    
    Answer: `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text();
    return generatedText;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to process chat request');
  }
};

/**
 * Explain a specific concept
 */
const explainConcept = async (
  concept: string,
  context: string,
): Promise<string> => {
  const prompt = `Explain the concept of "${concept}" based on the following context. 
    Provide a clear, educational explanation that's easy to understand.
    Include examples if relevant.
    
     Context:
     ${context.substring(0, 10000)}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text();
    return generatedText;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to explain concept');
  }
};

export const geminiService = {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  chatWithContext,
  explainConcept,
};
