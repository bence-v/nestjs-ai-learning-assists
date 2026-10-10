import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;

  const mockUser = {
    id: 99,
    username: 'Josh',
    email: 'josh@gmail.com',
    profileImage: 'testUrl',
    createdAt: '2020.01.01',
    updatedAt: '2026.01.01',
  };

  const mockDashboardService = {
    getUserData: jest.fn().mockResolvedValue({ name: 'Test User', age: 30 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockDashboardService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should be defined', () => {
    const result = controller.getProfile(mockUser as any);

    expect(result).toEqual({ success: true, data: mockUser });
  });
});
