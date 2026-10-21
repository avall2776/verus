import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class UpdateMarketingCampaignDto {
  @IsOptional()
  @IsString()
  marketingClientId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsNumber()
  budgetDaily?: number;

  @IsOptional()
  @IsNumber()
  budgetTotal?: number;

  @IsOptional()
  @IsNumber()
  spentAmount?: number;

  @IsOptional()
  @IsNumber()
  leadsGenerated?: number;

  @IsOptional()
  @IsNumber()
  cpl?: number;

  @IsOptional()
  @IsNumber()
  roas?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  campaignUrl?: string;
}
