import { Test, TestingModule } from '@nestjs/testing';
import { FlashcardController } from './flashcard.controller';
import { FlashcardService } from './flashcard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('FlashcardController', () => {
  let controller: FlashcardController;

  const mockFlashcardService = {
    getFlashcards: jest.fn(),
    getAllFlashcardSets: jest.fn(),
    reviewFlashcard: jest.fn(),
    toggleStarFlashcard: jest.fn(),
    deleteFlashcardSet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlashcardController],
      providers: [
        {
          provide: FlashcardService,
          useValue: mockFlashcardService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FlashcardController>(FlashcardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
