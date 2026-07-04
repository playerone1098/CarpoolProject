import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['public', 'private'])
  type: 'public' | 'private';

  @IsOptional()
  createdBy?: string;
}
