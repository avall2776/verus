import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsOptional()
  @IsBoolean()
  hasCRM?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWhatsApp?: boolean;

  @IsOptional()
  @IsBoolean()
  hasInstagram?: boolean;

  @IsOptional()
  @IsBoolean()
  hasAIAgent?: boolean;

  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @IsOptional()
  @IsNumber()
  maxAIMsgs?: number;

  @IsOptional()
  @IsNumber()
  maxWorkspaces?: number;

  @IsOptional()
  modules?: any;
}
