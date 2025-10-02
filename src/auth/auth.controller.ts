import { Controller, Post, Body, HttpException, HttpStatus, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('request-otp')
  async requestOtp(@Body() dto: RequestOtpDto) {
    await this.authService.requestOtp(dto.phone);
    return { ok: true, message: 'OTP sent (dev: check server log)' };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const res = await this.authService.verifyOtp(dto.phone, dto.otp);
    if (!res.ok) throw new HttpException(res.message, HttpStatus.BAD_REQUEST);
    return { ok: true, token: res.token, user: res.user, isNew: res.isNew };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return { ok: true, user: req.user };
  }
}
