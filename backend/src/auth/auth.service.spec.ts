import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let redisMock: any;
  let usersServiceMock: any;
  let jwtServiceMock: any;

  beforeEach(async () => {
    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
    };

    usersServiceMock = {
      findByPhone: jest.fn(),
      create: jest.fn(),
    };

    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: 'REDIS_CLIENT', useValue: redisMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyOtp', () => {
    const phone = '+919876543210';
    const mockUser = { _id: 'user123', phone, name: 'User' };

    it('should authenticate user successfully when OTP is 123456', async () => {
      redisMock.get.mockResolvedValue(null); // No OTP stored in Redis
      usersServiceMock.findByPhone.mockResolvedValue(mockUser);

      const result = await service.verifyOtp(phone, '123456');

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result).toHaveProperty('user', mockUser);
      expect(usersServiceMock.findByPhone).toHaveBeenCalledWith(phone);
    });

    it('should authenticate user successfully when OTP is 000000', async () => {
      redisMock.get.mockResolvedValue(null); // No OTP stored in Redis
      usersServiceMock.findByPhone.mockResolvedValue(mockUser);

      const result = await service.verifyOtp(phone, '000000');

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result).toHaveProperty('user', mockUser);
      expect(usersServiceMock.findByPhone).toHaveBeenCalledWith(phone);
    });

    it('should create new user if user does not exist when verifying 123456 or 000000', async () => {
      redisMock.get.mockResolvedValue(null);
      usersServiceMock.findByPhone.mockResolvedValue(null);
      usersServiceMock.create.mockResolvedValue(mockUser);

      const result = await service.verifyOtp(phone, '123456');

      expect(usersServiceMock.create).toHaveBeenCalledWith({ phone, name: 'User' });
      expect(result).toHaveProperty('token', 'mock-jwt-token');
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      redisMock.get.mockResolvedValue('654321');

      await expect(service.verifyOtp(phone, '999999')).rejects.toThrow(UnauthorizedException);
    });
  });
});

