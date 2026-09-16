import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateTicketDto {
  @IsNotEmpty({ message: 'O assunto do chamado é obrigatório.' })
  @IsString()
  subject: string;

  @IsNotEmpty({ message: 'A descrição detalhada do chamado é obrigatória.' })
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], { message: 'Prioridade inválida.' })
  priority?: string;

  @IsOptional()
  @IsString()
  contactId?: string;
}
