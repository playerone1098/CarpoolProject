import { IsNotEmpty, IsNumber, IsString, IsDateString, IsOptional, IsObject } from 'class-validator';

export class CreateRideDto {
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
  pickupCoords?: { lat: number; lng: number };

  @IsObject()
  dropCoords?: { lat: number; lng: number };

  @IsNumber()
  price?: number;
}
