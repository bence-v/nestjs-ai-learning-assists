import {
  Controller,
  Post,
  Body,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { GenerateFlashcardsParams } from './params/GenerateFlashcardsParams';
import { AiService } from './ai.service';
import { GenerateQuizParams } from './params/GenerateQuizParams';
import { ChatParams } from './params/ChatParams';
import { ExplainConceptParams } from './params/ExplainConceptParams';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}
  @UseGuards(JwtAuthGuard)
  @Post('generate-flashcards')
  async generateFlashcards(
    @Body() request: GenerateFlashcardsParams,
    @GetUser('id') userId: number,
  ) {
    const flashcardSet = await this.aiService.generateFlashcards(
      request,
      userId,
    );
    return {
      success: true,
      data: flashcardSet,
      message: 'Flashcards generated successfully.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-quiz')
  generateQuiz(
    @Body() request: GenerateQuizParams,
    @GetUser('id') userId: number,
  ) {
    const quiz = this.aiService.generateQuiz(request, userId);
    return {
      success: true,
      data: quiz,
      message: 'Quiz generated successfully.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-summary')
  generateSummary(
    @Body('documentId') documentId: number,
    @GetUser('id') userId: number,
  ) {
    if (!documentId) {
      throw new NotFoundException('Please provide a document id!');
    }

    const data = this.aiService.generateSummary(documentId, userId);

    return {
      success: true,
      data,
      message: 'Summary generated successfully.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  chat(@Body() request: ChatParams, @GetUser('id') userId: number) {
    const data = this.aiService.chat(request, userId);

    return {
      success: true,
      data,
      message: 'Response generated successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('explain-concept')
  async explainConcept(
    request: ExplainConceptParams,
    @GetUser('id') userId: number,
  ) {
    const data = await this.aiService.explainConcept(request, userId);

    return {
      success: true,
      data,
      message: 'Explanation generated successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat-history/:documentId')
  async getChatHistory(
    @Param('documentId') documentId: number,
    @GetUser('id') userId: number,
  ) {
    if (!documentId) {
      throw new NotFoundException('Please provide documentId.');
    }

    const chatHistory = await this.aiService.getChatHistory(documentId, userId);

    if (!chatHistory) {
      return {
        success: true,
        data: [],
        message: 'No chat history found for this document.',
      };
    }

    return {
      success: true,
      data: chatHistory,
      message: 'Chat history retrieved successfully.',
    };
  }
}
