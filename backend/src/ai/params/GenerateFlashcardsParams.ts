import { IsNotEmpty, IsInt, IsPositive } from 'class-validator';

export class GenerateFlashcardsParams {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  documentId: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  count: number = 10;
}
