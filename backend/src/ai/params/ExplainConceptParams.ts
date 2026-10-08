import { IsNotEmpty, IsInt, IsPositive } from 'class-validator';

export class ExplainConceptParams {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  documentId: number;

  @IsNotEmpty()
  concept: string;
}
