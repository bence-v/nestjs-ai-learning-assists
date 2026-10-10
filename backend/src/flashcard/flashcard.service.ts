import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class FlashcardService {
  constructor(private readonly databaseService: DatabaseService) {}
  async getFlashcards(documentId: number, userId: number) {
    const flashcards = await this.databaseService.flashcard.findMany({
      where: {
        userId,
        documentId: Number(documentId),
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

    return flashcards;
  }
  async getAllFlashcardSets(userId: number) {
    const flashcards = await this.databaseService.flashcard.findMany({
      where: {
        userId: userId,
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

    return flashcards;
  }

  async reviewFlashcard(cardId: number, userId: number) {
    const card = await this.databaseService.card.findFirst({
      where: {
        id: cardId,
        flashcard: {
          userId: userId,
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Flashcard set or card not found.');
    }

    await this.databaseService.card.update({
      where: {
        id: cardId,
      },
      data: {
        lastReviewed: new Date(),
        reviewCount: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      message: 'Flashcards have been successfully updated!!',
    };
  }

  async toggleStarFlashcard(cardId: number, userId: number) {
    const card = await this.databaseService.card.findFirst({
      where: {
        id: cardId,
        flashcard: {
          userId,
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Flashcard set or card not found.');
    }

    const updatedCard = await this.databaseService.card.update({
      where: {
        id: cardId,
      },
      data: {
        isStarred: !card.isStarred,
      },
    });

    const updatedFlashcardSet = await this.databaseService.flashcard.findUnique(
      {
        where: { id: card.flashcardId! },
        include: { cards: true },
      },
    );

    return {
      success: true,
      data: updatedFlashcardSet,
      message: `Flashcard ${updatedCard.isStarred ? 'favorited' : 'unfavorited'} successfully`,
    };
  }

  async deleteFlashcardSet(id: number, userId: number) {
    const flashcard = await this.databaseService.flashcard.findUnique({
      where: { id: id },
    });

    if (!flashcard) {
      throw new NotFoundException('The flashcard set was not found!');
    }

    if (flashcard.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this set!',
      );
    }

    await this.databaseService.flashcard.delete({
      where: { id: id },
    });

    return {
      success: true,
      message: 'The flashcard set was successfully deleted!',
    };
  }
}
