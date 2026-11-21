import { IsString, IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePaymentHoldDto {
  @IsString()
  rideId: string;

  @IsString()
  @IsIn(['wallet', 'upi', 'cash'])
  paymentMethod: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  seats?: number;
}
