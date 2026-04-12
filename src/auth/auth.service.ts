import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import Redis from 'ioredis';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async sendOtp(phone: string) {
    const attempts = await this.redis.get(`otp_attempts:${phone}`);
    if (attempts && Number(attempts) >= 5) {
      throw new UnauthorizedException('Too many OTP requests. Try later.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${phone}`, otp, 'EX', 300); // expires in 5 min
    await this.redis.incr(`otp_attempts:${phone}`);
    await this.redis.expire(`otp_attempts:${phone}`, 300); // reset after 5 min

    console.log(`OTP for ${phone}: ${otp}`); // TODO: integrate SMS provider
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, otp: string) {
    const storedOtp = await this.redis.get(`otp:${phone}`);
    if (!storedOtp || storedOtp !== otp) {
      // Special case for testing: allow 000000 or 123456 as valid OTP
      if (otp !== '000000' && otp !== '123456') {
        throw new UnauthorizedException('Invalid OTP');
      }
    }

    await this.redis.del(`otp:${phone}`);

    let user = await this.usersService.findByPhone(phone);
    if (!user) user = await this.usersService.create({ phone, name: 'User' });

    const token = this.jwtService.sign({ sub: user._id, phone: user.phone }, { expiresIn: '15m' });
    const refreshToken = randomBytes(32).toString('hex');
    await this.redis.set(`refresh:${phone}`, refreshToken, 'EX', 7 * 24 * 3600); // 7 days

    return { token, refreshToken, user };
  }

  async refreshToken(phone: string, refreshToken: string) {
    const stored = await this.redis.get(`refresh:${phone}`);
    if (!stored || stored !== refreshToken) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.usersService.findByPhone(phone);
    if (!user) throw new UnauthorizedException('User not found');

    const token = this.jwtService.sign({ sub: user._id, phone: user.phone }, { expiresIn: '15m' });
    return { token };
  }
}
