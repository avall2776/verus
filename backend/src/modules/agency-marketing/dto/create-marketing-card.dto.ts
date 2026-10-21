import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';

export class CreateMarketingCardDto {
  @IsNotEmpty({ message: 'O ID do cliente de marketing é obrigatório.' })
  @IsString()
  marketingClientId: string;

  @IsNotEmpty({ message: 'O título do card é obrigatório.' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  format?: string; // REELS, CARROSSEL, POST, CAMPANHA, STORIES, OUTRO

  @IsOptional()
  @IsString()
  status?: string; // BACKLOG, PLANEJAMENTO, DESIGN_VIDEO, REVISAO_INTERNA, APROVACAO_CLIENTE, AGENDADO_POSTADO

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
  priority?: string; // BAIXA, MEDIA, ALTA, URGENTE

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
