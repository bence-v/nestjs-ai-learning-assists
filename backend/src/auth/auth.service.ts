import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service'; // A te Prisma service-ed
import * as bcrypt from 'bcrypt';
import {
  UpdateProfileDto,
  UpdateProfileResponse,
} from './params/UpdateProfileDto';
import { ChangePasswordDto } from './params/ChangePasswordDto';
import { RegisterDto } from './params/RegisterDto';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials!');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials!');
    }

    const payload = { sub: user.id, email: user.email };

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
      message: 'Login successful!',
      token: this.jwtService.sign(payload),
    };
  }

  async updateProfile(
    userId: number,
    updateData: UpdateProfileDto,
  ): Promise<UpdateProfileResponse> {
    const updatedUser = await this.databaseService.user.update({
      where: {
        id: userId,
      },
      data: {
        username: updateData.username,
        email: updateData.email,
        profileImage: updateData.profileImage,
      },
      select: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
      },
    });

    return {
      success: true,
      message: 'Profile updated successfully!',
      data: updatedUser,
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    const isMatch = await bcrypt.compare(dto.currentPassword, user!.password);

    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.databaseService.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedNewPassword,
      },
    });

    return {
      success: true,
      message: 'Password changed successfully!',
    };
  }

  async register(dto: RegisterDto) {
    const userExists = await this.databaseService.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (userExists) {
      const errorMessage =
        userExists.email === dto.email
          ? 'Email already registered.'
          : 'Username already taken.';

      throw new BadRequestException(errorMessage);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.databaseService.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
        createdAt: true,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      success: true,
      data: {
        user: user,
        token: token,
      },
      message: 'User registered success!',
    };
  }
}
