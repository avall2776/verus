import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSupportAiConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  knowledgeBase?: string;

  @IsOptional()
  @IsString()
  guardrails?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  autoHandoffCrm?: boolean;

  @IsOptional()
  @IsBoolean()
  autoCloseSolved?: boolean;
}
