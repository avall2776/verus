import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGoalDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['REVENUE', 'DEALS', 'LEADS'])
  targetType: 'REVENUE' | 'DEALS' | 'LEADS';

  @IsNumber()
  @Type(() => Number)
  targetValue: number;

  @IsDateString()
  @IsNotEmpty()
  periodStart: string;

  @IsDateString()
  @IsNotEmpty()
  periodEnd: string;
}
