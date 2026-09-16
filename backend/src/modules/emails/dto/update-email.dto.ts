import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateEmailDto {
  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;
}
