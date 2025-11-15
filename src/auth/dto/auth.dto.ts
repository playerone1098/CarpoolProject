import { IsPhoneNumber, IsString } from 'class-validator';

export class SendOtpDto {
  @IsPhoneNumber()
  phone: string;
}

export class VerifyOtpDto {
  @IsPhoneNumber()
  phone: string;

  @IsString()
  otp: string;
}

export class RefreshTokenDto {
  @IsPhoneNumber()
  phone: string;

  @IsString()
  refreshToken: string;
}
