import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException } from '@nestjs/common';
import { geminiService } from '../utils/geminiService';
import { textChunker } from '../utils/textChunker';
import { GenerateQuizParams } from './params/GenerateQuizParams';

jest.mock('../utils/geminiService', () => ({
  geminiService: {
    generateFlashcards: jest.fn(),
    generateQuiz: jest.fn(),
    generateSummary: jest.fn(),
    chatWithContext: jest.fn(),
    explainConcept: jest.fn(),
  },
}));

jest.mock('../utils/textChunker', () => ({
  textChunker: {
    findRelevantChunks: jest.fn(),
  },
}));

describe('AiService', () => {
  let service: AiService;
  let databaseService: DatabaseService;
 
  const mockDatabaseService = {
    document: {
      findUnique: jest.fn(),
    },
    flashcard: {
      create: jest.fn(),
    },
    quiz: {
      create: jest.fn(),
    },
    chatHistory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFlashcards', () => {
    const userId = 1;
    const request = {
      documentId: 100,
      count: 5,
    };

    const mockDocument = {
      id: request.documentId,
      extractedText: 'Ez itt a teszt dokumentum szövege.',
    };

    const mockedGeminiCards = [
      {
        question: 'testQuestion',
        answer: 'testAnswer',
        difficulty: 'testDifficulty',
      },
    ];

    const mockCreatedFlashcardSet = {
      id: 999,
      userId: userId,
      documentId: mockDocument.id,
      cards: mockedGeminiCards.map((card) => ({
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty,
        reviewCount: 0,
        isStarred: false,
      })),
    };

    it('should throw NotFoundException if document is not found or not ready', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(null);

      await expect(service.generateFlashcards(request, userId)).rejects.toThrow(
        new NotFoundException('Document was not found or not ready.'),
      );
      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: request.documentId, status: 'ready', userId },
      });

      expect(geminiService.generateFlashcards).not.toHaveBeenCalled();
      expect(mockDatabaseService.flashcard.create).not.toHaveBeenCalled();
    });

    it('should successfully generate and save flashcards', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(mockDocument);

      (geminiService.generateFlashcards as jest.Mock).mockResolvedValue(
        mockedGeminiCards,
      );

      mockDatabaseService.flashcard.create.mockResolvedValue(
        mockCreatedFlashcardSet,
      );

      const result = await service.generateFlashcards(request, userId);

      expect(geminiService.generateFlashcards).toHaveBeenCalledWith(
        mockDocument.extractedText,
        request.count,
      );

      expect(mockDatabaseService.flashcard.create).toHaveBeenCalledWith({
        data: {
          userId,
          documentId: mockDocument.id,
          cards: {
            create: [
              {
                question: 'testQuestion',
                answer: 'testAnswer',
                difficulty: 'testDifficulty',
                reviewCount: 0,
                isStarred: false,
              },
            ],
          },
        },
      });

      expect(result).toEqual(mockCreatedFlashcardSet);
    });
  });

  describe('generateQuiz', () => {
    const userId = 1;

    const request = {
      documentId: 100,
      numQuestions: 3,
      title: 'My Custom Quiz Title',
    };

    const mockDocument = {
      id: request.documentId,
      title: 'Biology Chapter 1',
      extractedText: 'Sejtek osztódása és DNS replikáció...',
    };

    const mockedGeminiQuestions = [
      {
        question: 'Mi a sejtmag feladata?',
        options: ['Energiatermelés', 'DNS tárolás', 'Mozgás', 'Emésztés'],
        correctAnswer: 'DNS tárolás',
        explanation: 'A sejtmag tárolja a genetikai információt.',
        difficulty: 'easy',
      },
    ];

    const mockCreatedQuiz = {
      id: 500,
      userId,
      documentId: mockDocument.id,
      title: request.title,
      totalQuestions: mockedGeminiQuestions.length,
      score: 0,
      questions: mockedGeminiQuestions,
    };

    it('should throw NotFoundException if document is not found or not ready', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(null);

      await expect(service.generateQuiz(request, userId)).rejects.toThrow(
        new NotFoundException('Document was not found or not ready.'),
      );

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: request.documentId, status: 'ready', userId },
      });

      expect(geminiService.generateQuiz).not.toHaveBeenCalled();
      expect(mockDatabaseService.quiz.create).not.toHaveBeenCalled();
    });

    it('should successfully generate and save a quiz WITH a provided title', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(mockDocument);
      (geminiService.generateQuiz as jest.Mock).mockResolvedValue(
        mockedGeminiQuestions,
      );
      mockDatabaseService.quiz.create.mockResolvedValue(mockCreatedQuiz);

      const result = await service.generateQuiz(request, userId);

      expect(geminiService.generateQuiz).toHaveBeenCalledWith(
        mockDocument.extractedText,
        request.numQuestions,
      );

      expect(mockDatabaseService.quiz.create).toHaveBeenCalledWith({
        data: {
          userId,
          documentId: request.documentId,
          title: request.title,
          totalQuestions: mockedGeminiQuestions.length,
          score: 0,
          questions: {
            create: [
              {
                question: 'Mi a sejtmag feladata?',
                options: [
                  'Energiatermelés',
                  'DNS tárolás',
                  'Mozgás',
                  'Emésztés',
                ],
                correctAnswer: 'DNS tárolás',
                explanation: 'A sejtmag tárolja a genetikai információt.',
                difficulty: 'easy',
              },
            ],
          },
        },
      });

      expect(result).toEqual(mockCreatedQuiz);
    });

    it('should successfully generate a quiz and use FALLBACK title if none provided', async () => {
      const requestWithoutTitle = {
        documentId: 100,
        numQuestions: 3,
      } as GenerateQuizParams;

      mockDatabaseService.document.findUnique.mockResolvedValue(mockDocument);
      (geminiService.generateQuiz as jest.Mock).mockResolvedValue(
        mockedGeminiQuestions,
      );

      const expectedFallbackTitle = `${mockDocument.title} - Quiz`;
      mockDatabaseService.quiz.create.mockResolvedValue({
        ...mockCreatedQuiz,
        title: expectedFallbackTitle,
      });

      await service.generateQuiz(requestWithoutTitle, userId);

      expect(mockDatabaseService.quiz.create).toHaveBeenCalled();

      const createMock = mockDatabaseService.quiz.create;
      const createArgs = (createMock.mock.calls as unknown[][])[0][0] as {
        data: { title: string };
      };

      expect(createArgs.data.title).toBe(expectedFallbackTitle);
    });
  });

  describe('generateSummary', () => {
    const userId = 1;
    const documentId = 100;

    const mockDocument = {
      id: documentId,
      extractedText: 'Ez itt egy hosszú szöveg, amit össze kell foglalni.',
      title: 'Test Title',
    };

    const mockSummaryText = 'Ez a generált összefoglaló szövege.';

    it('should throw NotFoundException if document is not found or not ready', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(null);

      await expect(service.generateSummary(documentId, userId)).rejects.toThrow(
        new NotFoundException('Document was not found or not ready.'),
      );

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId, status: 'ready', userId },
      });

      expect(geminiService.generateSummary).not.toHaveBeenCalled();
    });

    it('should successfully generate and return the summary', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(mockDocument);

      (geminiService.generateSummary as jest.Mock).mockResolvedValue(
        mockSummaryText,
      );

      const result = await service.generateSummary(documentId, userId);

      expect(geminiService.generateSummary).toHaveBeenCalledWith(
        mockDocument.extractedText,
      );

      expect(result).toEqual({
        documentId: mockDocument.id,
        title: mockDocument.title,
        summary: mockSummaryText,
      });
    });
  });

  describe('chat', () => {
    const userId = 1;
    const documentId = 100;
    const request = {
      documentId,
      question: 'What is the main topic?',
    };

    const mockDocument = {
      id: documentId,
      title: 'Teszt Dokumentum',
      chunks: [
        { content: 'Content 1', pageNumber: 1, chunkIndex: 1 },
        { content: 'Content 2', pageNumber: 2, chunkIndex: 2 },
      ],
    };

    const mockRelevantChunks = [{ content: 'Content 1', chunkIndex: 1 }];
    const chunkIndexes = [1];

    const mockChatHistory = {
      id: 555,
      documentId: documentId,
      userId: userId,
    };

    const mockAiAnswer = 'This is the generated answer based on context.';

    it('should throw NotFoundException if document is not found or not ready', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(null);

      await expect(service.chat(request, userId)).rejects.toThrow(
        new NotFoundException('Document was not found or not ready.'),
      );

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId, status: 'ready', userId },
        include: { chunks: true },
      });

      expect(textChunker.findRelevantChunks).not.toHaveBeenCalled();
      expect(geminiService.chatWithContext).not.toHaveBeenCalled();
    });

    it('should handle chat WITH existing chat history', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(mockDocument);
      (textChunker.findRelevantChunks as jest.Mock).mockReturnValue(
        mockRelevantChunks,
      );

      mockDatabaseService.chatHistory.findFirst.mockResolvedValue(
        mockChatHistory,
      );

      (geminiService.chatWithContext as jest.Mock).mockResolvedValue(
        mockAiAnswer,
      );
      mockDatabaseService.chatHistory.update.mockResolvedValue({
        id: mockChatHistory.id,
      });

      const result = await service.chat(request, userId);

      expect(mockDatabaseService.chatHistory.create).not.toHaveBeenCalled();

      expect(mockDatabaseService.chatHistory.update).toHaveBeenCalledWith({
        where: { id: mockChatHistory.id },
        data: {
          messages: {
            create: [
              { role: 'user', content: request.question, relevantChunks: [] },
              {
                role: 'assistant',
                content: mockAiAnswer,
                relevantChunks: chunkIndexes,
              },
            ],
          },
        },
      });

      expect(result).toEqual({
        documentId: mockDocument.id,
        title: mockDocument.title,
        answer: mockAiAnswer,
        relevantChunks: chunkIndexes,
        chatHistory: mockChatHistory.id,
      });
    });

    it('should create NEW chat history if none exists and handle chat', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(mockDocument);

      (textChunker.findRelevantChunks as jest.Mock).mockReturnValue(
        mockRelevantChunks,
      );

      mockDatabaseService.chatHistory.findFirst.mockResolvedValue(null);

      mockDatabaseService.chatHistory.create.mockResolvedValue(mockChatHistory);

      (geminiService.chatWithContext as jest.Mock).mockResolvedValue(
        mockAiAnswer,
      );
      mockDatabaseService.chatHistory.update.mockResolvedValue({
        id: mockChatHistory.id,
      });

      await service.chat(request, userId);

      expect(mockDatabaseService.chatHistory.create).toHaveBeenCalledWith({
        data: {
          userId,
          documentId: mockDocument.id,
        },
      });

      expect(mockDatabaseService.chatHistory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockChatHistory.id },
        }),
      );
    });
  });

  describe('explainConcept', () => {
    const userId = 1;
    const documentId = 100;

    const request = {
      documentId,
      concept: 'The concept to explain',
    };

    const mockDocument = {
      id: documentId,
      title: 'Test Title',
      chunks: [
        { content: 'Chunk 1', pageNumber: 7, chunkIndex: 1 },
        { content: 'Chunk 2', pageNumber: 8, chunkIndex: 2 },
      ],
    };

    const mockRelevantChunks = [
      { content: 'Relevant Content 1', chunkIndex: 1, pageNumber: 2 },
      { content: 'Relevant Content 2', chunkIndex: 3, pageNumber: 4 },
    ];

    const mockAiExplanation = 'This is the detailed explanation from Gemini.';

    it('should throw NotFoundException if document is not found or not ready', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(null);

      await expect(service.explainConcept(request, userId)).rejects.toThrow(
        new NotFoundException('Document was not found or not ready.'),
      );

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId, status: 'ready', userId },
        include: { chunks: true },
      });

      expect(textChunker.findRelevantChunks).not.toHaveBeenCalled();
      expect(geminiService.explainConcept).not.toHaveBeenCalled();
    });

    it('should successfully explain the concept based on relevant chunks', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(mockDocument);

      (textChunker.findRelevantChunks as jest.Mock).mockReturnValue(
        mockRelevantChunks,
      );

      (geminiService.explainConcept as jest.Mock).mockResolvedValue(
        mockAiExplanation,
      );

      const result = await service.explainConcept(request, userId);

      expect(textChunker.findRelevantChunks).toHaveBeenCalledWith(
        mockDocument.chunks,
        request.concept,
        3,
      );

      const expectedContext = 'Relevant Content 1\n\nRelevant Content 2';
      expect(geminiService.explainConcept).toHaveBeenCalledWith(
        request.concept,
        expectedContext,
      );

      expect(result).toEqual({
        concept: request.concept,
        explanation: mockAiExplanation,
        relevantChunks: [1, 3],
      });
    });
  });

  describe('getChatHistory', () => {
    const userId = 1;
    const documentId = 100;

    const mockDocument = {
      id: documentId,
      status: 'ready',
      userId,
    };

    const mockMessages = [
      {
        role: 'user',
        content: 'What is this document about?',
        relevantChunks: [],
      },
      {
        role: 'assistant',
        content: 'It is a test document.',
        relevantChunks: [1],
      },
    ];

    it('should throw NotFoundException if document is not found or not ready', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(null);

      await expect(service.getChatHistory(documentId, userId)).rejects.toThrow(
        new NotFoundException('Document was not found or not ready.'),
      );

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId, status: 'ready', userId },
      });

      expect(mockDatabaseService.chatHistory.findFirst).not.toHaveBeenCalled();
    });

    it('should return an empty array if document exists but NO chat history is found', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(mockDocument);

      mockDatabaseService.chatHistory.findFirst.mockResolvedValue(null);

      const result = await service.getChatHistory(documentId, userId);

      expect(mockDatabaseService.chatHistory.findFirst).toHaveBeenCalledWith({
        where: { documentId: documentId },
        select: { messages: true },
      });

      expect(result).toEqual([]);
    });

    it('should return messages if chat history exists', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(mockDocument);

      mockDatabaseService.chatHistory.findFirst.mockResolvedValue({
        messages: mockMessages,
      });

      const result = await service.getChatHistory(documentId, userId);

      expect(result).toEqual(mockMessages);
    });
  });
});
