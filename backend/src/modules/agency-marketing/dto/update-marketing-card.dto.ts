import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class UpdateMarketingCardDto {
  @IsOptional()
  @IsString()
  marketingClientId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  checklist?: Array<{ id: string; text: string; completed: boolean }>;

  @IsOptional()
  attachments?: Array<{ id: string; name: string; url: string; type: string }>;
}
