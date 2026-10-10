import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockDatabaseService = {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update user in database and return formatted response', async () => {
      const userId = 1;
      const updateData = {
        username: 'NewJosh',
        email: 'newjosh@gmail.com',
        profileImage: 'newUrl.jpg',
      };

      const expectedDbResult = {
        id: userId,
        username: updateData.username,
        email: updateData.email,
        profileImage: updateData.profileImage,
      };

      mockDatabaseService.user.update.mockResolvedValue(expectedDbResult);

      const result = await service.updateProfile(userId, updateData);

      expect(mockDatabaseService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          profileImage: true,
        },
      });

      expect(result).toEqual({
        success: true,
        message: 'Profile updated successfully!',
        data: expectedDbResult,
      });
    });
  });

  describe('changePassword', () => {
    const userId = 1;
    const dto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword456',
    };

    const mockDbUser = {
      id: userId,
      password: 'hashed_old_password',
    };

    it('should successfully change the password if current password is correct', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(mockDbUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');

      mockDatabaseService.user.update.mockResolvedValue({});

      const result = await service.changePassword(userId, dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.newPassword, 10);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        dto.currentPassword,
        mockDbUser.password,
      );

      expect(mockDatabaseService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: 'hashed_new_password' },
      });

      expect(result).toEqual({
        success: true,
        message: 'Password changed successfully!',
      });
    });

    it('should throw UnauthorizedException if current password is wrong', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(mockDbUser);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const hashSpy = jest.spyOn(bcrypt, 'hash');

      await expect(service.changePassword(userId, dto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(hashSpy).not.toHaveBeenCalled();
      expect(mockDatabaseService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const dto = {
      username: 'josh_doe',
      email: 'josh@gmail.com',
      password: 'securePassword123',
    };

    const createdUser = {
      id: 1,
      username: dto.username,
      email: dto.email,
      profileImage: null,
      createdAt: new Date(),
    };

    it('should successfully register a new user and return a token', async () => {
      mockDatabaseService.user.findFirst.mockResolvedValue(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      mockDatabaseService.user.create.mockResolvedValue(createdUser);

      mockJwtService.sign.mockReturnValue('mocked_jwt_token');
      const result = await service.register(dto);

      expect(mockDatabaseService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: dto.email }, { username: dto.username }],
        },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);

      expect(mockDatabaseService.user.create).toHaveBeenCalledWith({
        data: {
          username: dto.username,
          email: dto.email,
          password: 'hashed_password',
        },
        select: expect.any(Object) as Record<string, boolean>,
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: createdUser.id,
        email: createdUser.email,
      });

      expect(result).toEqual({
        success: true,
        data: {
          user: createdUser,
          token: 'mocked_jwt_token',
        },
        message: 'User registered success!',
      });
    });

    it('should throw BadRequestException if email is already registered', async () => {
      mockDatabaseService.user.findFirst.mockResolvedValue({
        email: dto.email,
        username: 'other_username',
      });

      const createSpy = mockDatabaseService.user.create;

      await expect(service.register(dto)).rejects.toThrow(
        new BadRequestException('Email already registered.'),
      );

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if username is already taken', async () => {
      mockDatabaseService.user.findFirst.mockResolvedValue({
        email: 'different@gmail.com',
        username: dto.username,
      });

      const createSpy = mockDatabaseService.user.create;

      await expect(service.register(dto)).rejects.toThrow(
        new BadRequestException('Username already taken.'),
      );

      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const email = 'josh@gmail.com';
    const pass = 'password123';

    const mockDbUser = {
      id: 1,
      username: 'josh_doe',
      email: email,
      password: 'hashed_password',
      profileImage: 'profile.jpg',
    };

    it('should return user data and token on successful login', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(mockDbUser);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      mockJwtService.sign.mockReturnValue('valid_jwt_token');

      const result = await service.login(email, pass);

      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(pass, mockDbUser.password);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockDbUser.id,
        email: mockDbUser.email,
      });

      expect(result).toEqual({
        success: true,
        user: {
          id: mockDbUser.id,
          username: mockDbUser.username,
          email: mockDbUser.email,
          profileImage: mockDbUser.profileImage,
        },
        message: 'Login successful!',
        token: 'valid_jwt_token',
      });
    });

    it('should throw UnauthorizedException if user is not found (wrong email)', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      const compareSpy = jest.spyOn(bcrypt, 'compare');

      await expect(service.login(email, pass)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials!'),
      );

      expect(compareSpy).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(mockDbUser);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const signSpy = mockJwtService.sign;

      await expect(service.login(email, pass)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials!'),
      );

      expect(signSpy).not.toHaveBeenCalled();
    });
  });
});
