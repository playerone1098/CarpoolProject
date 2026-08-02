import { IsPhoneNumber, IsOptional, IsString, IsObject, IsBoolean } from 'class-validator';

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
  role?: string;

  @IsBoolean()
  @IsOptional()
  isCarOwner?: boolean;

  @IsString()
  @IsOptional()
  profilePhoto?: string;

  @IsObject()
  @IsOptional()
  homeAddress?: {
    address: string;
    coords: { lat: number; lng: number };
  };

  @IsObject()
  @IsOptional()
  workAddress?: {
    address: string;
    coords: { lat: number; lng: number };
  };

  @IsObject()
  @IsOptional()
  carInfo?: {
    model?: string;
    color?: string;
    plateNumber?: string;
  };
}

