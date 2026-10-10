import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { DatabaseService } from '../database/database.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    document: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    flashcard: {
      count: jest.fn(),
    },
    quiz: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    card: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('getDashboardStats', () => {
    const userId = 1;

    it('should return populated dashboard stats successfully', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      mockDatabaseService.document.count.mockResolvedValue(10);
      mockDatabaseService.flashcard.count.mockResolvedValue(5);
      mockDatabaseService.quiz.count.mockResolvedValue(8);

      mockDatabaseService.card.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(40)
        .mockResolvedValueOnce(15);

      mockDatabaseService.quiz.aggregate.mockResolvedValue({
        _avg: { score: 85.6 },
      });

      const mockRecentDocuments = [{ id: 1, title: 'Doc 1' }];
      mockDatabaseService.document.findMany.mockResolvedValue(
        mockRecentDocuments,
      );

      const mockRecentQuizzes = [{ id: 1, title: 'Quiz 1', score: 90 }];
      mockDatabaseService.quiz.findMany.mockResolvedValue(mockRecentQuizzes);

      const result = await service.getDashboardStats(userId);

      expect(mockDatabaseService.document.count).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockDatabaseService.quiz.aggregate).toHaveBeenCalledWith({
        where: { userId, completedAt: { not: null } },
        _avg: { score: true },
      });

      expect(result).toEqual({
        success: true,
        data: {
          overview: {
            totalDocuments: 10,
            totalFlashcardSets: 5,
            totalQuizzes: 8,
            totalFlashcards: 100,
            reviewedFlashcards: 40,
            starredFlashcards: 15,
            averageScore: 86,
            studyStreak: 4,
          },
          recentActivity: {
            documents: mockRecentDocuments,
            quizzes: mockRecentQuizzes,
          },
        },
      });
    });

    it('should handle missing data gracefully (e.g., brand new user)', async () => {
      const userId = 1;

      jest.spyOn(Math, 'random').mockReturnValue(0);

      mockDatabaseService.document.count.mockResolvedValue(0);
      mockDatabaseService.flashcard.count.mockResolvedValue(0);
      mockDatabaseService.quiz.count.mockResolvedValue(0);
      mockDatabaseService.card.count.mockResolvedValue(0);

      mockDatabaseService.quiz.aggregate.mockResolvedValue({
        _avg: { score: null },
      });

      mockDatabaseService.document.findMany.mockResolvedValue([]);
      mockDatabaseService.quiz.findMany.mockResolvedValue([]);

      const result = await service.getDashboardStats(userId);

      expect(result.data.overview.averageScore).toBe(0);
      expect(result.data.overview.studyStreak).toBe(1);
      expect(result.data.overview.totalDocuments).toBe(0);
      expect(result.data.recentActivity.documents).toEqual([]);
    });
  });
});
