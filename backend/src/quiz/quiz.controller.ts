import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('api/quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':documentId')
  async getQuizzes(
    @Param('documentId') documentId: number,
    @GetUser('id') userId: number,
  ) {
    return await this.quizService.getQuizzes(documentId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('quiz/:id')
  async getQuizById(
    @Param('quizId') quizId: number,
    @GetUser('id') userId: number,
  ) {
    return await this.quizService.getQuizById(quizId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  async submitQuiz(
    @Body('answers')
    answers: Prisma.UserAnswersCreateWithoutQuizInput[],
    @Body('quizId') quizId: number,
    @GetUser('id') userId: number,
  ) {
    return await this.quizService.submitQuiz(answers, quizId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/results')
  async getQuizResults(@Param('id') id: number, @GetUser('id') userId: number) {
    return await this.quizService.getQuizResults(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteQuiz(@Body('id') id: number, @GetUser('id') userId: number) {
    return await this.quizService.deleteQuiz(id, userId);
  }
}
