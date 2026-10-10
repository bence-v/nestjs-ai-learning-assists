import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from './quiz.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubmitUserAnswerInput } from './dto/submitUserAnswerInput';

describe('QuizService', () => {
  let service: QuizService;

  const mockDatabaseService = {
    quiz: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getQuizzes', () => {
    it('should return a list of quizzes with count', async () => {
      const userId = 1;
      const documentId = 10;
      const mockQuizzes = [{ id: 1 }, { id: 2 }];

      mockDatabaseService.quiz.findMany.mockResolvedValue(mockQuizzes);

      const result = await service.getQuizzes(documentId, userId);

      expect(mockDatabaseService.quiz.findMany).toHaveBeenCalledWith({
        where: { userId, documentId },
        include: {
          document: { select: { title: true, fileName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual({
        success: true,
        count: 2,
        data: mockQuizzes,
      });
    });
  });

  describe('getQuizById', () => {
    const userId = 1;
    const quizId = 100;

    it('should throw NotFoundException if quiz is not found', async () => {
      mockDatabaseService.quiz.findFirst.mockResolvedValue(null);

      await expect(service.getQuizById(quizId, userId)).rejects.toThrow(
        new NotFoundException('Quiz was not found.'),
      );
    });

    it('should return the quiz data successfully', async () => {
      const mockQuiz = { id: quizId, questions: [] };
      mockDatabaseService.quiz.findFirst.mockResolvedValue(mockQuiz);

      const result = await service.getQuizById(quizId, userId);

      expect(mockDatabaseService.quiz.findFirst).toHaveBeenCalledWith({
        where: { id: quizId, userId },
        include: { questions: true },
      });
      expect(result).toEqual({ success: true, data: mockQuiz });
    });
  });

  describe('submitQuiz', () => {
    const userId = 1;
    const quizId = 100;

    const mockQuestions = [
      { id: 1, correctAnswer: 'A' },
      { id: 2, correctAnswer: 'B' },
      { id: 3, correctAnswer: 'C' },
    ];

    const mockQuiz = {
      id: quizId,
      totalQuestions: 3,
      completedAt: null,
      questions: mockQuestions,
    };

    it('should throw NotFoundException if quiz does not exist', async () => {
      mockDatabaseService.quiz.findFirst.mockResolvedValue(null);
      await expect(service.submitQuiz([], quizId, userId)).rejects.toThrow(
        new NotFoundException('Quiz not found.'),
      );
    });

    it('should throw BadRequestException if quiz is already completed', async () => {
      mockDatabaseService.quiz.findFirst.mockResolvedValue({
        ...mockQuiz,
        completedAt: new Date(),
      });

      await expect(service.submitQuiz([], quizId, userId)).rejects.toThrow(
        new BadRequestException('Quiz already completed.'),
      );
    });

    it('should calculate score and update quiz successfully', async () => {
      mockDatabaseService.quiz.findFirst.mockResolvedValue(mockQuiz);
      mockDatabaseService.quiz.update.mockResolvedValue({});

      const userAnswers: SubmitUserAnswerInput[] = [
        { questionIndex: 0, selectedAnswer: 'A' },
        { questionIndex: 1, selectedAnswer: 'B' },
        { questionIndex: 2, selectedAnswer: 'D' },
      ];

      const result = await service.submitQuiz(userAnswers, quizId, userId);

      const expectedScore = 67;

      expect(mockDatabaseService.quiz.update).toHaveBeenCalledWith({
        where: { id: quizId },
        data: {
          score: expectedScore,
          completedAt: expect.any(Date) as Date,
          userAnswers: {
            create: [
              {
                questionIndex: 0,
                selectedAnswer: 'A',
                isCorrect: true,
                answeredAt: expect.any(Date) as Date,
              },
              {
                questionIndex: 1,
                selectedAnswer: 'B',
                isCorrect: true,
                answeredAt: expect.any(Date) as Date,
              },
              {
                questionIndex: 2,
                selectedAnswer: 'D',
                isCorrect: false,
                answeredAt: expect.any(Date) as Date,
              },
            ],
          },
        },
      });

      expect(result.data.score).toBe(expectedScore);
      expect(result.data.correctCount).toBe(2);
      expect(result.success).toBe(true);
    });
  });

  describe('getQuizResults', () => {
    const userId = 1;
    const quizId = 100;

    it('should throw NotFoundException if quiz is not found', async () => {
      mockDatabaseService.quiz.findFirst.mockResolvedValue(null);
      await expect(service.getQuizResults(quizId, userId)).rejects.toThrow(
        new NotFoundException('Quiz not found.'),
      );
    });

    it('should throw BadRequestException if quiz is NOT completed', async () => {
      mockDatabaseService.quiz.findFirst.mockResolvedValue({
        id: quizId,
        completedAt: null,
      });
      await expect(service.getQuizResults(quizId, userId)).rejects.toThrow(
        new BadRequestException('Quiz not completed.'),
      );
    });

    it('should map questions to user answers correctly', async () => {
      const mockQuizData = {
        id: quizId,
        completedAt: new Date(),
        title: 'Test Quiz',
        score: 100,
        totalQuestions: 2,
        document: { title: 'Doc' },
        questions: [
          {
            question: 'Q1?',
            options: ['A', 'B'],
            correctAnswer: 'A',
            explanation: 'Exp1',
          },
          {
            question: 'Q2?',
            options: ['C', 'D'],
            correctAnswer: 'C',
            explanation: 'Exp2',
          },
        ],
        userAnswers: [
          { questionIndex: 0, selectedAnswer: 'A', isCorrect: true },
        ],
      };

      mockDatabaseService.quiz.findFirst.mockResolvedValue(mockQuizData);

      const result = await service.getQuizResults(quizId, userId);

      expect(result.data.results[0]).toEqual({
        questionIndex: 0,
        question: 'Q1?',
        options: ['A', 'B'],
        correctAnswer: 'A',
        selectedAnswer: 'A',
        isCorrect: true,
        explanation: 'Exp1',
      });

      expect(result.data.results[1]).toEqual({
        questionIndex: 1,
        question: 'Q2?',
        options: ['C', 'D'],
        correctAnswer: 'C',
        selectedAnswer: null,
        isCorrect: false,
        explanation: 'Exp2',
      });
    });
  });

  describe('deleteQuiz', () => {
    const userId = 1;
    const quizId = 100;

    it('should throw NotFoundException if quiz is not found', async () => {
      mockDatabaseService.quiz.findFirst.mockResolvedValue(null);
      await expect(service.deleteQuiz(quizId, userId)).rejects.toThrow(
        new NotFoundException('Quiz was not found.'),
      );
      expect(mockDatabaseService.quiz.delete).not.toHaveBeenCalled();
    });

    it('should delete quiz successfully', async () => {
      mockDatabaseService.quiz.findFirst.mockResolvedValue({
        id: quizId,
        userId,
      });
      mockDatabaseService.quiz.delete.mockResolvedValue({});

      const result = await service.deleteQuiz(quizId, userId);

      expect(mockDatabaseService.quiz.delete).toHaveBeenCalledWith({
        where: { id: quizId },
      });
      expect(result).toEqual({
        success: true,
        message: 'Quiz deleted successfully!',
      });
    });
  });
});
