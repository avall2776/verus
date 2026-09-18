import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateVoipConfigDto {
  @IsString()
  @IsNotEmpty()
  providerName: string; // Direct Call, FreeSWITCH Local, Asterisk PBX, Vono, Outro

  @IsString()
  @IsNotEmpty()
  sipHost: string;

  @IsNumber()
  @IsOptional()
  sipPort?: number;

  @IsString()
  @IsOptional()
  sipUsername?: string;

  @IsString()
  @IsOptional()
  sipPassword?: string;

  @IsString()
  @IsOptional()
  webrtcWssUrl?: string;

  @IsString()
  @IsOptional()
  directCallToken?: string;

  @IsString()
  @IsOptional()
  stunServer?: string;

  @IsString()
  @IsOptional()
  turnServer?: string;

  @IsBoolean()
  @IsOptional()
  autoRecord?: boolean;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
