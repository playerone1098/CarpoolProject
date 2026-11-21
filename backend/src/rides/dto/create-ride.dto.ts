import { IsNotEmpty, IsNumber, IsString, IsDateString, IsOptional, IsObject } from 'class-validator';

export class CreateRideDto {
  @IsString()
  @IsOptional()
  driver?: string;

  @IsString()
  @IsOptional()
  driverName?: string;

  @IsString()
  @IsOptional()
  carModel?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  seatsAvailable?: number;

  @IsNumber()
  @IsOptional()
  availableSeats?: number;

  @IsString()
  @IsOptional()
  pickupLocation?: string;

  @IsString()
  @IsOptional()
  pickup?: string;

  @IsString()
  @IsOptional()
  dropLocation?: string;

  @IsString()
  @IsOptional()
  drop?: string;

  @IsString()
  @IsOptional()
  destination?: string;

  @IsString()
  @IsOptional()
  rideTime?: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  groupId?: string;

  @IsObject()
  @IsOptional()
  pickupCoords?: { lat: number; lng: number };

  @IsObject()
  @IsOptional()
  dropCoords?: { lat: number; lng: number };

  @IsNumber()
  @IsOptional()
  price?: number;
}
