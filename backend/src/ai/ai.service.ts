import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GenerateFlashcardsParams } from './params/GenerateFlashcardsParams';
import { geminiService } from '../utils/geminiService';
import { GenerateQuizParams } from './params/GenerateQuizParams';
import { ChatParams } from './params/ChatParams';
import { textChunker } from '../utils/textChunker';
import { Difficulty } from '@prisma/client';
import { Chunk } from '@prisma/client';
import { ExplainConceptParams } from './params/ExplainConceptParams';

@Injectable()
export class AiService {
  constructor(private readonly databaseService: DatabaseService) {}
  async generateFlashcards(request: GenerateFlashcardsParams, userId: number) {
    const { documentId, count } = request;

    const document = await this.databaseService.document.findUnique({
      where: { id: documentId, status: 'ready', userId },
    });

    if (!document) {
      throw new NotFoundException('Document was not found or not ready.');
    }

    const cards = await geminiService.generateFlashcards(
      document.extractedText,
      count,
    );

    const flashcardSet = await this.databaseService.flashcard.create({
      data: {
        userId,
        documentId: document.id,
        cards: {
          create: cards.map((card) => ({
            question: card.question,
            answer: card.answer,
            difficulty: card.difficulty,
            reviewCount: 0,
            isStarred: false,
          })),
        },
      },
    });

    return flashcardSet;
  }

  async generateQuiz(request: GenerateQuizParams, userId: number) {
    const { documentId, numQuestions, title } = request;

    const document = await this.databaseService.document.findUnique({
      where: { id: documentId, status: 'ready', userId },
    });

    if (!document) {
      throw new NotFoundException('Document was not found or not ready.');
    }

    const questions = await geminiService.generateQuiz(
      document.extractedText,
      numQuestions,
    );

    const flashcardSet = await this.databaseService.quiz.create({
      data: {
        userId,
        documentId: documentId,
        title: title || `${document.title} - Quiz`,
        questions: {
          create: questions.map((question) => ({
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            difficulty: question.difficulty as Difficulty,
          })),
        },
        totalQuestions: questions.length,
        score: 0,
      },
    });

    return flashcardSet;
  }

  async generateSummary(documentId: number, userId: number) {
    const document = await this.databaseService.document.findUnique({
      where: { id: documentId, status: 'ready', userId },
    });

    if (!document) {
      throw new NotFoundException('Document was not found or not ready.');
    }

    const summary = await geminiService.generateSummary(document.extractedText);

    return {
      documentId: document.id,
      title: document.title,
      summary,
    };
  }

  async chat(request: ChatParams, userId: number) {
    const { documentId, question } = request;

    const document = await this.databaseService.document.findUnique({
      where: {
        id: documentId,
        status: 'ready',
        userId,
      },
      include: { chunks: true },
    });

    if (!document) {
      throw new NotFoundException('Document was not found or not ready.');
    }

    const relevantChunks = textChunker.findRelevantChunks(
      document.chunks,
      question,
      3,
    );

    const chunkIndexes = relevantChunks.map((c: Chunk) => c.chunkIndex);

    let chatHistory = await this.databaseService.chatHistory.findFirst({
      where: { documentId: documentId, userId },
    });

    if (!chatHistory) {
      chatHistory = await this.databaseService.chatHistory.create({
        data: {
          userId,
          documentId: document.id,
        },
      });
    }

    const answer = await geminiService.chatWithContext(
      question,
      relevantChunks,
    );

    const updatedHistory = await this.databaseService.chatHistory.update({
      where: { id: chatHistory.id },
      data: {
        messages: {
          create: [
            {
              role: 'user',
              content: question,
              relevantChunks: [],
            },
            {
              role: 'assistant',
              content: answer,
              relevantChunks: chunkIndexes,
            },
          ],
        },
      },
    });

    return {
      documentId: document.id,
      title: document.title,
      answer,
      relevantChunks: chunkIndexes,
      chatHistory: updatedHistory.id,
    };
  }

  async explainConcept(request: ExplainConceptParams, userId: number) {
    const { documentId, concept } = request;

    const document = await this.databaseService.document.findUnique({
      where: { id: documentId, status: 'ready', userId },
      include: { chunks: true },
    });

    if (!document) {
      throw new NotFoundException('Document was not found or not ready.');
    }

    const relevantChunks = textChunker.findRelevantChunks(
      document.chunks,
      concept,
      3,
    );
    const context = relevantChunks.map((c: Chunk) => c.content).join('\n\n');

    const explanation = await geminiService.explainConcept(concept, context);

    return {
      concept,
      explanation,
      relevantChunks: relevantChunks.map((c: Chunk) => c.chunkIndex),
    };
  }

  async getChatHistory(documentId: number, userId: number) {
    const document = await this.databaseService.document.findUnique({
      where: { id: documentId, status: 'ready', userId },
    });

    if (!document) {
      throw new NotFoundException('Document was not found or not ready.');
    }

    const chatHistory = await this.databaseService.chatHistory.findFirst({
      where: { documentId: documentId },
      select: { messages: true },
    });

    if (!chatHistory) {
      return [];
    }

    return chatHistory.messages;
  }
}
