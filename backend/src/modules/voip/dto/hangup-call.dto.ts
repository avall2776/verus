import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class HangupCallDto {
  @IsString()
  @IsNotEmpty()
  callId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
