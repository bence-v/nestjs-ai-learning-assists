import { Test, TestingModule } from '@nestjs/testing';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DatabaseService } from '../database/database.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('DocumentController', () => {
  let controller: DocumentController;

  const mockDocumentService = {
    uploadDocument: jest.fn(),
    getDocuments: jest.fn(),
    getDocument: jest.fn(),
    deleteDocument: jest.fn(),
  };

  const mockDatabaseService = {
    document: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        {
          provide: DocumentService,
          useValue: mockDocumentService,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DocumentController>(DocumentController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ====================================================================
  // 1. uploadDocument
  // ====================================================================
  describe('uploadDocument', () => {
    it('should create a document in DB and trigger background processing', async () => {
      const userId = 1;
      const title = 'My Uploaded PDF';

      const mockFile = {
        path: 'uploads/documents/test.pdf',
        originalname: 'test.pdf',
        size: 1024,
      } as Express.Multer.File;

      const expectedNewDocument = {
        id: 100,
        userId,
        filePath: mockFile.path,
        fileName: mockFile.originalname,
        title,
        status: 'processing',
      };

      mockDatabaseService.document.create.mockResolvedValue(
        expectedNewDocument,
      );

      const result = await controller.uploadDocument(mockFile, title, userId);

      expect(mockDatabaseService.document.create).toHaveBeenCalledWith({
        data: {
          userId,
          filePath: mockFile.path,
          fileName: mockFile.originalname,
          fileSize: '1024',
          title: title,
          status: 'processing',
        },
      });

      expect(mockDocumentService.uploadDocument).toHaveBeenCalledWith(
        expectedNewDocument.id,
        mockFile.path,
      );

      expect(result).toEqual({
        success: true,
        message: 'File uploaded! File being processed in background...',
        document: expectedNewDocument,
      });
    });
  });

  // ====================================================================
  // 2. getDocuments
  // ====================================================================
  describe('getDocuments', () => {
    it('should fetch documents and format the _count property properly', async () => {
      const userId = 1;

      const rawDocuments = [
        {
          id: 100,
          title: 'Doc 1',
          _count: { flashcards: 5, quizzes: 2 },
        },
        {
          id: 101,
          title: 'Doc 2',
          _count: { flashcards: 0, quizzes: 0 },
        },
      ];

      mockDocumentService.getDocuments.mockResolvedValue(rawDocuments);

      const result = await controller.getDocuments(userId);

      expect(mockDocumentService.getDocuments).toHaveBeenCalledWith(userId);

      expect(result).toEqual([
        { id: 100, title: 'Doc 1', flashcardCount: 5, quizCount: 2 },
        { id: 101, title: 'Doc 2', flashcardCount: 0, quizCount: 0 },
      ]);
    });
  });

  // ====================================================================
  // 3. getDocument
  // ====================================================================
  describe('getDocument', () => {
    it('should return a single formatted document wrapped in success object', async () => {
      const documentId = 100;
      const userId = 1;

      const mockFormattedDocument = {
        id: documentId,
        title: 'Single Doc',
        flashcardCount: 10,
        quizCount: 3,
      };

      mockDocumentService.getDocument.mockResolvedValue(mockFormattedDocument);

      const result = await controller.getDocument(documentId, userId);

      expect(mockDocumentService.getDocument).toHaveBeenCalledWith(
        documentId,
        userId,
      );
      expect(result).toEqual({
        success: true,
        data: mockFormattedDocument,
      });
    });
  });

  // ====================================================================
  // 4. deleteDocument
  // ====================================================================
  describe('deleteDocument', () => {
    it('should call deleteDocument service and return the result', async () => {
      const documentId = 100;
      const userId = 1;
      const mockDeleteResult = { success: true, message: 'Deleted!' };

      mockDocumentService.deleteDocument.mockResolvedValue(mockDeleteResult);

      const result = await controller.deleteDocument(documentId, userId);

      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(
        documentId,
        userId,
      );
      expect(result).toEqual(mockDeleteResult);
    });
  });
});
