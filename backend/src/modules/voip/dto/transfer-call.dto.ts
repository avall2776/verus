import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class TransferCallDto {
  @IsString()
  @IsNotEmpty()
  callId: string;

  @IsString()
  @IsNotEmpty()
  targetDestination: string;

  @IsString()
  @IsOptional()
  type?: 'BLIND' | 'ATTENDED';
}
