import { IsNotEmpty, IsInt, IsPositive, IsString } from 'class-validator';

export class GenerateQuizParams {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  documentId: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  numQuestions: number = 5;

  @IsNotEmpty()
  @IsString()
  title: string;
}
