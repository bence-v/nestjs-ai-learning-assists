import { Test, TestingModule } from '@nestjs/testing';
import { FlashcardService } from './flashcard.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('FlashcardService', () => {
  let service: FlashcardService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    flashcard: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    card: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlashcardService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<FlashcardService>(FlashcardService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFlashcards', () => {
    it('should return flashcards for a specific document and user', async () => {
      const userId = 1;
      const documentId = 10;
      const mockFlashcards = [{ id: 1, documentId: 10, userId: 1 }];

      mockDatabaseService.flashcard.findMany.mockResolvedValue(mockFlashcards);

      const result = await service.getFlashcards(documentId, userId);

      expect(mockDatabaseService.flashcard.findMany).toHaveBeenCalledWith({
        where: { userId, documentId: Number(documentId) },
        include: {
          document: { select: { title: true, fileName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockFlashcards);
    });
  });

  describe('getAllFlashcardSets', () => {
    it('should return all flashcard sets for a specific user', async () => {
      const userId = 1;
      const mockFlashcards = [{ id: 1, userId: 1 }, { id: 2, userId: 1 }];

      mockDatabaseService.flashcard.findMany.mockResolvedValue(mockFlashcards);

      const result = await service.getAllFlashcardSets(userId);

      expect(mockDatabaseService.flashcard.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          document: { select: { title: true, fileName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockFlashcards);
    });
  });

  describe('reviewFlashcard', () => {
    const userId = 1;
    const cardId = 100;

    it('should throw NotFoundException if card does not exist or belongs to another user', async () => {
      mockDatabaseService.card.findFirst.mockResolvedValue(null);

      await expect(service.reviewFlashcard(cardId, userId)).rejects.toThrow(
        new NotFoundException('Flashcard set or card not found.')
      );

      expect(mockDatabaseService.card.update).not.toHaveBeenCalled();
    });

    it('should update lastReviewed and increment reviewCount', async () => {
      const mockCard = { id: cardId, flashcard: { userId } };
      mockDatabaseService.card.findFirst.mockResolvedValue(mockCard);
      mockDatabaseService.card.update.mockResolvedValue({});

      const result = await service.reviewFlashcard(cardId, userId);

      expect(mockDatabaseService.card.update).toHaveBeenCalledWith({
        where: { id: cardId },
        data: {
          lastReviewed: expect.any(Date),
          reviewCount: { increment: 1 },
        },
      });

      expect(result).toEqual({
        success: true,
        message: 'Flashcards have been successfully updated!!',
      });
    });
  });

  describe('toggleStarFlashcard', () => {
    const userId = 1;
    const cardId = 100;
    const flashcardId = 50;

    it('should throw NotFoundException if card is not found', async () => {
      mockDatabaseService.card.findFirst.mockResolvedValue(null);

      await expect(service.toggleStarFlashcard(cardId, userId)).rejects.toThrow(
        new NotFoundException('Flashcard set or card not found.')
      );
    });

    it('should toggle star status to TRUE and return updated flashcard set', async () => {
      const mockCard = { id: cardId, flashcardId, isStarred: false };
      const updatedCard = { ...mockCard, isStarred: true };
      const updatedFlashcardSet = { id: flashcardId, cards: [updatedCard] };

      mockDatabaseService.card.findFirst.mockResolvedValue(mockCard);
      mockDatabaseService.card.update.mockResolvedValue(updatedCard);
      mockDatabaseService.flashcard.findUnique.mockResolvedValue(updatedFlashcardSet);

      const result = await service.toggleStarFlashcard(cardId, userId);

      expect(mockDatabaseService.card.update).toHaveBeenCalledWith({
        where: { id: cardId },
        data: { isStarred: true },
      });

      expect(result).toEqual({
        success: true,
        data: updatedFlashcardSet,
        message: 'Flashcard favorited successfully',
      });
    });

    it('should toggle star status to FALSE and return updated flashcard set', async () => {
      const mockCard = { id: cardId, flashcardId, isStarred: true };
      const updatedCard = { ...mockCard, isStarred: false };
      const updatedFlashcardSet = { id: flashcardId, cards: [updatedCard] };

      mockDatabaseService.card.findFirst.mockResolvedValue(mockCard);
      mockDatabaseService.card.update.mockResolvedValue(updatedCard);
      mockDatabaseService.flashcard.findUnique.mockResolvedValue(updatedFlashcardSet);

      const result = await service.toggleStarFlashcard(cardId, userId);

      expect(result.message).toBe('Flashcard unfavorited successfully');
    });
  });

  describe('deleteFlashcardSet', () => {
    const userId = 1;
    const flashcardId = 50;

    it('should throw NotFoundException if flashcard set is not found', async () => {
      mockDatabaseService.flashcard.findUnique.mockResolvedValue(null);

      await expect(service.deleteFlashcardSet(flashcardId, userId)).rejects.toThrow(
        new NotFoundException('The flashcard set was not found!')
      );
    });

    it('should throw ForbiddenException if user does not own the flashcard set', async () => {
      const mockFlashcard = { id: flashcardId, userId: 99 };
      mockDatabaseService.flashcard.findUnique.mockResolvedValue(mockFlashcard);

      await expect(service.deleteFlashcardSet(flashcardId, userId)).rejects.toThrow(
        new ForbiddenException('You do not have permission to delete this set!')
      );

      expect(mockDatabaseService.flashcard.delete).not.toHaveBeenCalled();
    });

    it('should successfully delete the flashcard set if user is the owner', async () => {
      const mockFlashcard = { id: flashcardId, userId: userId };
      mockDatabaseService.flashcard.findUnique.mockResolvedValue(mockFlashcard);
      mockDatabaseService.flashcard.delete.mockResolvedValue({});

      const result = await service.deleteFlashcardSet(flashcardId, userId);

      expect(mockDatabaseService.flashcard.delete).toHaveBeenCalledWith({
        where: { id: flashcardId },
      });

      expect(result).toEqual({
        success: true,
        message: 'The flashcard set was successfully deleted!',
      });
    });
  });
});