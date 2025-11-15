import { IsPhoneNumber, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsPhoneNumber()
  phone: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsString()
  @IsOptional()
  profilePhoto?: string;
}
