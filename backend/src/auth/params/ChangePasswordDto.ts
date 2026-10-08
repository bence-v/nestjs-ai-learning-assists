import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Please provide current password.' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Please provide new password.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  newPassword: string;
}
