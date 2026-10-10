import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { DatabaseService } from '../database/database.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

const multerOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads/documents';

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

      const ext = extname(file.originalname);

      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
};

@Controller('api/documents')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly databaseService: DatabaseService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5242880 }),

          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() title: string,
    @GetUser('id') userId: number,
  ) {
    const newDocument = await this.databaseService.document.create({
      data: {
        userId,
        filePath: file.path,
        fileName: file.originalname,
        fileSize: file.size.toString(),
        title: title,
        status: 'processing',
      },
    });

    this.documentService.uploadDocument(newDocument.id, file.path);

    return {
      success: true,
      message: 'File uploaded! File being processed in background...',
      document: newDocument,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getDocuments(@GetUser('id') userId: number) {
    const documents = await this.documentService.getDocuments(userId);

    const formattedDocuments = documents.map((doc) => {
      const { _count, ...rest } = doc;

      return {
        ...rest,
        flashcardCount: _count.flashcards,
        quizCount: _count.quizzes,
      };
    });

    return formattedDocuments;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:documentId')
  async getDocument(
    @Param('documentId') documentId: number,
    @GetUser('id') userId: number,
  ) {
    const data = await this.documentService.getDocument(documentId, userId);

    return {
      success: true,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:documentId')
  async deleteDocument(
    @Param('documentId') documentId: number,
    @GetUser('id') userId: number,
  ) {
    const result = await this.documentService.deleteDocument(
      Number(documentId),
      userId,
    );
    return result;
  }
}
