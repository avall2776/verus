import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  stage?: string; // Estágio do funil (ex: "seed", "new", "qualified") ou stageId

  @IsOptional()
  @IsString()
  funnel_id?: string; // ID do funil

  @IsOptional()
  @IsString()
  source?: string; // Default: "Meta Ads"

  @IsOptional()
  @IsString()
  campaign?: string; // Nome da campanha

  @IsOptional()
  @IsString()
  ad_name?: string; // Nome do anúncio

  @IsOptional()
  @IsString()
  adset_name?: string; // Nome do conjunto de anúncio

  @IsOptional()
  @IsString()
  form_id?: string; // ID do formulário Meta

  @IsOptional()
  @IsString()
  utm_source?: string;

  @IsOptional()
  @IsString()
  utm_medium?: string;

  @IsOptional()
  @IsString()
  utm_campaign?: string;

  @IsOptional()
  @IsString()
  utm_content?: string;

  @IsOptional()
  @IsString()
  utm_term?: string;

  @IsOptional()
  @IsString()
  assigned_to?: string; // ID do usuário responsável

  @IsOptional()
  @IsString()
  assigned_user_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  custom_fields?: Record<string, any>;
}
