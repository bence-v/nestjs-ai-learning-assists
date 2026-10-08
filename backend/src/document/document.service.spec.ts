import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import { PDFHelpers } from '../utils/pdfParser';

jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}));

jest.mock('../utils/pdfParser', () => ({
  PDFHelpers: {
    parseAndChunkPDF: jest.fn(),
  },
}));

describe('DocumentService', () => {
  let service: DocumentService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    document: {
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    databaseService = module.get<DatabaseService>(DatabaseService);

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    const documentId = 1;
    const filePath = 'uploads/test.pdf';

    it('should successfully parse PDF and update document status to "ready"', async () => {

      const mockParsedData = {
        text: 'Extracted PDF text',
        chunks: [{ content: 'Chunk 1', chunkIndex: 1, pageNumber: 1 }],
      };

      (PDFHelpers.parseAndChunkPDF as jest.Mock).mockResolvedValue(mockParsedData);
      mockDatabaseService.document.update.mockResolvedValue({});

      await service.uploadDocument(documentId, filePath);

      expect(PDFHelpers.parseAndChunkPDF).toHaveBeenCalledWith(filePath);
      expect(mockDatabaseService.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: {
          extractedText: mockParsedData.text,
          status: 'ready',
          chunks: {
            create: mockParsedData.chunks,
          },
        },
      });
    });

    it('should handle PDF parsing failure and update document status to "failed"', async () => {

      (PDFHelpers.parseAndChunkPDF as jest.Mock).mockRejectedValue(new Error('PDF error'));
      mockDatabaseService.document.update.mockResolvedValue({});

      await service.uploadDocument(documentId, filePath);

      expect(mockDatabaseService.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: {
          status: 'failed',
        },
      });
    });
  });

  describe('getDocuments', () => {
    it('should return a list of documents for a user without extractedText', async () => {
      const userId = 1;
      const mockDocuments = [{ id: 1, title: 'Doc 1' }];

      mockDatabaseService.document.findMany.mockResolvedValue(mockDocuments);

      const result = await service.getDocuments(userId);

      expect(mockDatabaseService.document.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { uploadDate: 'desc' },
        omit: { extractedText: true },
        include: {
          _count: {
            select: { flashcards: true, quizzes: true },
          },
        },
      });
      expect(result).toEqual(mockDocuments);
    });
  });


  describe('getDocument', () => {
    const userId = 1;
    const documentId = 100;

    it('should throw NotFoundException if document is not found', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(null);

      await expect(service.getDocument(documentId, userId)).rejects.toThrow(
        new NotFoundException('Document was not found or not ready.')
      );
    });

    it('should update lastAccessed, format the response, and return the document', async () => {
      const mockDocument = {
        id: documentId,
        title: 'My PDF',
        _count: { flashcards: 5, quizzes: 2 },
      };

      mockDatabaseService.document.findUnique.mockResolvedValue(mockDocument);
      mockDatabaseService.document.update.mockResolvedValue({});

      const result = await service.getDocument(documentId, userId);

      expect(mockDatabaseService.document.update).toHaveBeenCalledWith({
        where: { id: documentId, userId },
        data: { lastAccessed: expect.any(Date) },
      });

      expect(result).toEqual({
        id: documentId,
        title: 'My PDF',
        flashcardCount: 5,
        quizCount: 2,
      });
    });
  });

  describe('deleteDocument', () => {
    const userId = 1;
    const documentId = 100;
    const filePath = 'uploads/doc-to-delete.pdf';

    it('should throw NotFoundException if document is not found', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(null);

      await expect(service.deleteDocument(documentId, userId)).rejects.toThrow(
        new NotFoundException('Document was not found.')
      );
    });

    it('should successfully delete the file and the document from DB', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue({ id: documentId, filePath });
      (fs.unlink as jest.Mock).mockResolvedValue(undefined); // A fájl törlése sikeres

      const result = await service.deleteDocument(documentId, userId);

      expect(fs.unlink).toHaveBeenCalledWith(filePath);

      expect(mockDatabaseService.document.delete).toHaveBeenCalledWith({
        where: { id: documentId, userId },
      });

      expect(result).toEqual({
        success: true,
        message: 'The document has been successfully deleted!',
      });
    });

    it('should proceed to delete from DB EVEN IF file unlinking fails (e.g., file missing)', async () => {

      mockDatabaseService.document.findUnique.mockResolvedValue({ id: documentId, filePath });
      
      (fs.unlink as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await service.deleteDocument(documentId, userId);

      expect(fs.unlink).toHaveBeenCalledWith(filePath);

      expect(mockDatabaseService.document.delete).toHaveBeenCalledWith({
        where: { id: documentId, userId },
      });

      expect(result.success).toBe(true);
    });
  });
});