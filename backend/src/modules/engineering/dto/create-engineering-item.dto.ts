import { IsString, IsNotEmpty, IsOptional, IsArray, IsInt } from 'class-validator';

export class CreateEngineeringItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

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
  sourceType?: string; // MANUAL, SUPPORT_TICKET, AI_PROPOSAL

  @IsString()
  @IsOptional()
  sourceTicketId?: string;

  @IsString()
  @IsOptional()
  tenantName?: string;

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
