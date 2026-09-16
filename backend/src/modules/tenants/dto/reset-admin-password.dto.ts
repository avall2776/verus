import { IsOptional, IsString, MinLength } from 'class-validator';

export class ResetAdminPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres.' })
  newPassword?: string;
}
