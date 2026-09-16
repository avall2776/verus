import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTicketMessageDto {
  @IsNotEmpty({ message: 'O conteúdo da mensagem é obrigatório.' })
  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @IsOptional()
  attachments?: any;
}
