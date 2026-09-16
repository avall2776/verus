import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendEmailDto {
  @IsEmail({}, { message: 'Destinatário deve ser um e-mail válido' })
  @IsNotEmpty({ message: 'E-mail do destinatário é obrigatório' })
  recipientEmail: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsString()
  senderEmail?: string;

  @IsOptional()
  @IsString()
  cc?: string;

  @IsOptional()
  @IsString()
  bcc?: string;

  @IsNotEmpty({ message: 'Assunto do e-mail é obrigatório' })
  @IsString()
  subject: string;

  @IsNotEmpty({ message: 'Corpo da mensagem é obrigatório' })
  @IsString()
  bodyText: string;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  dealId?: string;

  @IsOptional()
  @IsString()
  proposalId?: string;

  @IsOptional()
  @IsString()
  contractId?: string;

  @IsOptional()
  @IsString()
  threadId?: string;

  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  attachments?: any;
}
