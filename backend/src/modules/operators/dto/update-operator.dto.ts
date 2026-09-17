import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class UpdateOperatorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Forneça um endereço de e-mail válido.' })
  email?: string;

  @IsOptional()
  @IsString()
  roleTitle?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  permissions?: Record<string, boolean>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  password?: string;
}
