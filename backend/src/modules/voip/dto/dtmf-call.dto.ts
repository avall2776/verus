import { IsString, IsNotEmpty } from 'class-validator';

export class DtmfCallDto {
  @IsString()
  @IsNotEmpty()
  callId: string;

  @IsString()
  @IsNotEmpty()
  digit: string; // 0-9, *, #
}
