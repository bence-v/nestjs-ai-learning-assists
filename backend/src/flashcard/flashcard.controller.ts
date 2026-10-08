import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FlashcardService } from './flashcard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('api/flashcards')
export class FlashcardController {
  constructor(private readonly flashcardService: FlashcardService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':documentId')
  async getFlashcards(
    @Param('documentId') documentId: number,
    @GetUser('id') userId: number,
  ) {
    const flashcards = await this.flashcardService.getFlashcards(
      documentId,
      userId,
    );

    return {
      success: true,
      data: flashcards,
      count: flashcards.length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getAllFlashcardSets(@GetUser('id') userId: number) {
    const flashcards = await this.flashcardService.getAllFlashcardSets(userId);

    return {
      success: true,
      data: flashcards,
      count: flashcards.length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':cardId/review')
  async reviewFlashcard(
    @Body('cardId') cardId: number,
    @GetUser('id') userId: number,
  ) {
    return await this.flashcardService.reviewFlashcard(cardId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':cardId/star')
  async toggleStarFlashcard(
    @Body('cardId') cardId: number,
    @GetUser('id') userId: number,
  ) {
    return await this.flashcardService.toggleStarFlashcard(cardId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteFlashcardSet(
    @Body('id') id: number,
    @GetUser('id') userId: number,
  ) {
    return await this.flashcardService.deleteFlashcardSet(id, userId);
  }
}
