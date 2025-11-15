import { IsNotEmpty, IsNumber, IsString, IsDateString } from 'class-validator';

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
}
