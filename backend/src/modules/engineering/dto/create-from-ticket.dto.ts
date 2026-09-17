import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFromTicketDto {
  @IsString()
  @IsNotEmpty()
  ticketId: string;

  @IsString()
  @IsOptional()
  customTitle?: string;

  @IsString()
  @IsOptional()
  technicalNotes?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  priority?: string;
}
