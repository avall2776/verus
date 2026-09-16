import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePlanDto } from './create-plan.dto';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da empresa é obrigatório.' })
  name: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail corporativo inválido.' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePlanDto)
  customPlan?: CreatePlanDto;

  @IsString()
  @IsNotEmpty({ message: 'O nome do administrador é obrigatório.' })
  adminName: string;

  @IsEmail({}, { message: 'E-mail do administrador inválido.' })
  @IsNotEmpty({ message: 'O e-mail do administrador é obrigatório.' })
  adminEmail: string;

  @IsString()
  @MinLength(6, { message: 'A senha do administrador deve ter pelo menos 6 caracteres.' })
  @IsNotEmpty({ message: 'A senha do administrador é obrigatória.' })
  adminPassword: string;
}
