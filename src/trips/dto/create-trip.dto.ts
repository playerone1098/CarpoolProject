import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateTripDto {
  @IsString()
  title: string;

  @IsOptional()
  start_time?: Date;

  @IsOptional()
  origin?: any;

  @IsOptional()
  destination?: any;

  @IsOptional()
  route_polyline?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  seats_total?: number;
}
