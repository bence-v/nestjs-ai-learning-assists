import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { DatabaseModule } from '../database/database.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [DatabaseModule],
  providers: [DocumentService],
  controllers: [DocumentController],
})
export class DocumentModule {}
