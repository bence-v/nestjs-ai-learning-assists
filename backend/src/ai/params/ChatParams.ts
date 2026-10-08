import { IsNotEmpty, IsInt, IsPositive } from 'class-validator';

export class ChatParams {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  documentId: number;

  @IsNotEmpty()
  question: string;
}
