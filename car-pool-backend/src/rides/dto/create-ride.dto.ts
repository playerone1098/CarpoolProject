import { IsNotEmpty, IsNumber, IsString, IsDateString, IsOptional, IsObject } from 'class-validator';

export class CreateRideDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsString()
  @IsNotEmpty()
  driver: string;

  @IsString()
  @IsNotEmpty()
  carModel: string;

  @IsNumber()
  seatsAvailable: number;

  @IsString()
  pickupLocation: string;

  @IsString()
  dropLocation: string;

  @IsDateString()
  rideTime: string;

  @IsObject()
  @IsOptional()
  pickupCoords?: { lat: number; lng: number };

  @IsObject()
  @IsOptional()
  dropCoords?: { lat: number; lng: number };
}
