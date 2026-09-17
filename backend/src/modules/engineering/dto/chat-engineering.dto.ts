import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class ChatEngineeringDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsArray()
  @IsOptional()
  history?: { role: 'user' | 'assistant' | 'system'; content: string }[];

  @IsString()
  @IsOptional()
  contextItemId?: string;
}
