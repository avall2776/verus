import { IsString, IsOptional, ValidateIf } from 'class-validator';

export class UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== null && v !== undefined)
  @IsString()
  logoUrl?: string | null;

  @IsString()
  @IsOptional()
  themeColor?: string;
}

