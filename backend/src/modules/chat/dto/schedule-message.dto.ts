import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsISO8601 } from 'class-validator';

export class ScheduleMessageDto {
  @IsString({ message: 'O conteúdo da mensagem deve ser um texto.' })
  @IsNotEmpty({ message: 'O conteúdo da mensagem é obrigatório.' })
  content: string;

  @IsString({ message: 'A data de agendamento deve ser informada.' })
  @IsNotEmpty({ message: 'A data e horário de agendamento são obrigatórios.' })
  scheduledAt: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;
}
