import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '@prisma/client';
import { SubmitUserAnswerInput } from './dto/submitUserAnswerInput';

@Injectable()
export class QuizService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getQuizzes(documentId: number, userId: number) {
    const quizzes = await this.databaseService.quiz.findMany({
      where: {
        userId,
        documentId: documentId,
      },
      include: {
        document: {
          select: {
            title: true,
            fileName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      count: quizzes.length,
      data: quizzes,
    };
  }

  async getQuizById(quizId: number, userId: number) {
    const quiz = await this.databaseService.quiz.findFirst({
      where: {
        id: quizId,
        userId,
      },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz was not found.');
    }

    return {
      success: true,
      data: quiz,
    };
  }

  async submitQuiz(
    answers: SubmitUserAnswerInput[],
    quizId: number,
    userId: number,
  ) {
    const quiz = await this.databaseService.quiz.findFirst({
      where: {
        id: quizId,
        userId,
      },
      include: {
        questions: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found.');
    }

    if (quiz.completedAt) {
      throw new BadRequestException('Quiz already completed.');
    }

    let correctCount = 0;

    const userAnswersToCreate: Prisma.UserAnswersCreateWithoutQuizInput[] = [];

    answers.forEach((answer) => {
      const { questionIndex, selectedAnswer } = answer;

      if (questionIndex < quiz.questions.length) {
        const question = quiz.questions[questionIndex];
        const isCorrect = question.correctAnswer === selectedAnswer;

        if (isCorrect) correctCount++;

        userAnswersToCreate.push({
          questionIndex,
          selectedAnswer,
          isCorrect,
          answeredAt: new Date(),
        });
      }
    });

    const score = Math.round((correctCount / quiz.totalQuestions) * 100);

    await this.databaseService.quiz.update({
      where: {
        id: quizId,
      },
      data: {
        score: score,
        completedAt: new Date(),
        userAnswers: {
          create: userAnswersToCreate,
        },
      },
    });

    return {
      success: true,
      data: {
        quizId: quiz.id,
        score,
        correctCount,
        totalQuestions: quiz.totalQuestions,
        percentage: score,
        userAnswers: userAnswersToCreate,
      },
      message: 'Quiz completed successfully',
    };
  }

  async getQuizResults(quizId: number, userId: number) {
    const quiz = await this.databaseService.quiz.findFirst({
      where: {
        id: quizId,
        userId,
      },
      include: {
        document: {
          select: {
            title: true,
          },
        },
        questions: {
          orderBy: { id: 'asc' },
        },
        userAnswers: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found.');
    }

    if (!quiz.completedAt) {
      throw new BadRequestException('Quiz not completed.');
    }

    const detailedResults = quiz.questions.map((question, index) => {
      const userAnswer = quiz.userAnswers.find(
        (a) => a.questionIndex === index,
      );

      return {
        questionIndex: index,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        selectedAnswer: userAnswer?.selectedAnswer || null,
        isCorrect: userAnswer?.isCorrect || false,
        explanation: question.explanation,
      };
    });

    return {
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          document: quiz.document,
          score: quiz.score,
          totalQuestions: quiz.totalQuestions,
          completedAt: quiz.completedAt,
        },
        results: detailedResults,
      },
    };
  }

  async deleteQuiz(quizId: number, userId: number) {
    const quiz = await this.databaseService.quiz.findFirst({
      where: {
        id: quizId,
        userId: userId,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz was not found.');
    }

    await this.databaseService.quiz.delete({
      where: {
        id: quizId,
      },
    });

    return {
      success: true,
      message: 'Quiz deleted successfully!',
    };
  }
}
