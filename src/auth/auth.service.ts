import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

type OtpEntry = { otp: string; expiresAt: number };

@Injectable()
export class AuthService {
  private otpStore = new Map<string, OtpEntry>();

  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  private generateOtp(): string {
    return (Math.floor(100000 + Math.random() * 900000)).toString();
  }

  async requestOtp(phone: string) {
    const otp = this.generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.otpStore.set(phone, { otp, expiresAt });
    console.log('[DEV OTP]', phone, otp);
    return true;
  }

  async verifyOtp(phone: string, otp: string) {
  const entry = this.otpStore.get(phone);
  if (!entry) return { ok: false, message: 'OTP not requested' };
  if (Date.now() > entry.expiresAt) {
    this.otpStore.delete(phone);
    return { ok: false, message: 'OTP expired' };
  }
  if (entry.otp !== otp) return { ok: false, message: 'Invalid OTP' };

  let user = await this.usersService.findByPhone(phone);
  let isNew = false;

  if (!user) {
    user = await this.usersService.createUser(phone);
    isNew = true; // mark user as new
  }

  const token = this.jwtService.sign({ sub: user.id, phone: user.phone });
  this.otpStore.delete(phone);

  return { ok: true, user, token, isNew };
}
}
