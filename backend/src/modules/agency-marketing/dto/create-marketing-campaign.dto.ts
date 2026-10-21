import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateMarketingCampaignDto {
  @IsNotEmpty({ message: 'O ID do cliente de marketing é obrigatório.' })
  @IsString()
  marketingClientId: string;

  @IsNotEmpty({ message: 'O nome da campanha é obrigatório.' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  platform?: string; // META_ADS, GOOGLE_ADS, TIKTOK_ADS, LINKEDIN_ADS

  @IsOptional()
  @IsString()
  status?: string; // ACTIVE, PAUSED, DRAFT, ENDED

  @IsOptional()
  @IsString()
  objective?: string; // LEADS, VENDAS, RECONHECIMENTO, TRAFEGO

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
