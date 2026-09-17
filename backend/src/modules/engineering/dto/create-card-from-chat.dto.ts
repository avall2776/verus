import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCardFromChatDto {
  @IsString()
  @IsNotEmpty()
  messageContext: string;

  @IsString()
  @IsOptional()
  customTitle?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  stage?: string; // AI_ANALYSIS, IN_DEVELOPMENT
}
