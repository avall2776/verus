import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateMarketingClientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  brandColor?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  planTier?: string;

  @IsOptional()
  monthlyDeliverables?: any;

  @IsOptional()
  @IsNumber()
  adBudget?: number;

  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
