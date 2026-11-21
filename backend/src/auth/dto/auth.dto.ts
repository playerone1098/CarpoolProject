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

export class EmailRegisterDto {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsString()
  phone: string;

  @IsString()
  name: string;
}

export class EmailLoginDto {
  @IsString()
  email: string;

  @IsString()
  password: string;
}
