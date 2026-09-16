import { IsString, IsOptional, IsNumber, IsBoolean, IsIn } from 'class-validator';

export class EmailSettingsDto {
  @IsString()
  @IsIn(['gmail', 'hostinger', 'smtp', 'resend'])
  provider: 'gmail' | 'hostinger' | 'smtp' | 'resend';

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @IsOptional()
  @IsString()
  smtpUser?: string;

  @IsOptional()
  @IsString()
  smtpPass?: string;

  @IsOptional()
  @IsString()
  fromName?: string;

  @IsOptional()
  @IsString()
  fromEmail?: string;

  @IsOptional()
  @IsString()
  resendApiKey?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
