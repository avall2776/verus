import { IsNotEmpty, IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class CreateOperatorDto {
  @IsNotEmpty({ message: 'O nome do operador é obrigatório.' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  @IsEmail({}, { message: 'Forneça um endereço de e-mail válido.' })
  email: string;

  @IsOptional()
  @IsString()
  roleTitle?: string; // ex: 'Atendente de Suporte', 'Analista Pleno', 'Gerente de Atendimento'

  @IsOptional()
  @IsString()
  role?: string; // 'AGENT'

  @IsOptional()
  permissions?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
