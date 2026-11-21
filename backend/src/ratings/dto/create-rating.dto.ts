import { IsString, IsNotEmpty, IsNumber, Min, Max, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateRatingDto {
  @IsString()
  @IsNotEmpty()
  rideId: string;

  @IsString()
  @IsNotEmpty()
  revieweeId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  comment?: string;

  @IsBoolean()
  @IsOptional()
  isSkipped?: boolean;
}
