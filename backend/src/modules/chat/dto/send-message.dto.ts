import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsString()
  @IsOptional()
  filename?: string;

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  instanceId?: string;

  @IsString()
  @IsOptional()
  quotedMessageId?: string;

  @IsOptional()
  quotedMessage?: any;
}
