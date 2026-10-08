import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DashboardService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getDashboardStats(userId: number) {
    const [
      totalDocuments,
      totalFlashcardSets,
      totalQuizzes,

      totalFlashcards,
      reviewedFlashcards,
      starredFlashcards,

      quizStats,

      recentDocuments,
      recentQuizzes,
    ] = await Promise.all([
      this.databaseService.document.count({ where: { userId } }),
      this.databaseService.flashcard.count({ where: { userId } }),
      this.databaseService.quiz.count({ where: { userId } }),

      this.databaseService.card.count({
        where: { flashcard: { userId } },
      }),
      this.databaseService.card.count({
        where: { flashcard: { userId }, reviewCount: { gt: 0 } }, // gt: 0 = greater than 0
      }),
      this.databaseService.card.count({
        where: { flashcard: { userId }, isStarred: true },
      }),

      this.databaseService.quiz.aggregate({
        where: { userId, completedAt: { not: null } },
        _avg: { score: true },
      }),

      this.databaseService.document.findMany({
        where: { userId },
        orderBy: { lastAccessed: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          fileName: true,
          lastAccessed: true,
          status: true,
        },
      }),

      this.databaseService.quiz.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          score: true,
          totalQuestions: true,
          completedAt: true,
          document: {
            select: { title: true },
          },
        },
      }),
    ]);

    const averageScore = quizStats._avg.score
      ? Math.round(quizStats._avg.score)
      : 0;

    const studyStreak = Math.floor(Math.random() * 7) + 1;

    return {
      success: true,
      data: {
        overview: {
          totalDocuments,
          totalFlashcardSets,
          totalFlashcards,
          reviewedFlashcards,
          starredFlashcards,
          totalQuizzes,
          averageScore,
          studyStreak,
        },
        recentActivity: {
          documents: recentDocuments,
          quizzes: recentQuizzes,
        },
      },
    };
  }
}
