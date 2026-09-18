import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ProductChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  codeSnippet?: string;
}
