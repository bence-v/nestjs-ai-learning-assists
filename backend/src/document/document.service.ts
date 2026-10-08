import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PDFHelpers } from '../utils/pdfParser';
import * as fs from 'fs/promises';

@Injectable()
export class DocumentService {
  constructor(private readonly databaseService: DatabaseService) {}

  async uploadDocument(documentId: number, filePath: string): Promise<void> {
    try {
      const { text, chunks } = await PDFHelpers.parseAndChunkPDF(filePath);

      await this.databaseService.document.update({
        where: { id: documentId },
        data: {
          extractedText: text,
          status: 'ready',
          chunks: {
            create: chunks,
          },
        },
      });

      console.log(`Document ${documentId} processed successfully!`);
    } catch (error) {
      console.log(`Error processing document ${documentId}`, error);

      await this.databaseService.document.update({
        where: { id: documentId },
        data: {
          status: 'failed',
        },
      });
    }
  }

  async getDocuments(userId: number) {
    const documents = await this.databaseService.document.findMany({
      where: {
        userId,
      },
      orderBy: {
        uploadDate: 'desc',
      },
      omit: {
        extractedText: true,
      },
      include: {
        _count: {
          select: {
            flashcards: true,
            quizzes: true,
          },
        },
      },
    });

    return documents;
  }

  async getDocument(documentId: number, userId: number) {
    const document = await this.databaseService.document.findUnique({
      where: {
        id: documentId,
        userId,
      },
      include: {
        _count: {
          select: {
            flashcards: true,
            quizzes: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document was not found or not ready.');
    }

    await this.databaseService.document.update({
      where: {
        id: documentId,
        userId,
      },
      data: {
        lastAccessed: new Date(),
      },
    });

    const { _count, ...rest } = document;

    return {
      ...rest,
      flashcardCount: _count.flashcards,
      quizCount: _count.quizzes,
    };
  }

  async deleteDocument(documentId: number, userId: number) {
    const document = await this.databaseService.document.findUnique({
      where: { id: documentId, userId },
    });

    if (!document) {
      throw new NotFoundException('Document was not found.');
    }

    if (document.filePath) {
      try {
        await fs.unlink(document.filePath);
        console.log(`File has been deleted: ${document.filePath}`);
      } catch (error) {
        console.warn(
          `Something went wrong with deleting the file, maybe its not here anymore: ${document.filePath}`,
        );
        console.warn(error);
      }
    }

    await this.databaseService.document.delete({
      where: { id: documentId, userId },
    });

    return {
      success: true,
      message: 'The document has been successfully deleted!',
    };
  }
}
