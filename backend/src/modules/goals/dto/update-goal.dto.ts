import { IsString, IsOptional, IsNumber, IsIn, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGoalDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['REVENUE', 'DEALS', 'LEADS'])
  targetType?: 'REVENUE' | 'DEALS' | 'LEADS';

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  targetValue?: number;

  @IsDateString()
  @IsOptional()
  periodStart?: string;

  @IsDateString()
  @IsOptional()
  periodEnd?: string;
}
