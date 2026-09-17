import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';

export class UpdateEngineeringItemDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  stage?: string; // CAPTURED, AI_ANALYSIS, IN_DEVELOPMENT, DEPLOYED

  @IsString()
  @IsOptional()
  priority?: string; // LOW, MEDIUM, HIGH, CRITICAL

  @IsString()
  @IsOptional()
  category?: string; // FEATURE, API, EXTENSION, PERFORMANCE, BUG_FIX, ARCHITECTURE

  @IsString()
  @IsOptional()
  aiSummary?: string;

  @IsString()
  @IsOptional()
  technicalNotes?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsInt()
  @IsOptional()
  estimatedHours?: number;

  @IsString()
  @IsOptional()
  assignedTo?: string;
}
