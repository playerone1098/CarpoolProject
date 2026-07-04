import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(['info', 'reminder', 'alert'])
  @IsOptional()
  type?: string;
}
