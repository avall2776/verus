import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class OriginateCallDto {
  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsOptional()
  callerId?: string;

  @IsString()
  @IsOptional()
  extension?: string;

  @IsString()
  @IsOptional()
  contactName?: string;
}
