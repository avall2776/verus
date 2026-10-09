import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CoachSupportAiDto {
  @IsNotEmpty({ message: 'A instrução de treinamento para a IA é obrigatória.' })
  @IsString()
  feedback: string;

  @IsOptional()
  @IsString()
  targetMessageId?: string;

  @IsOptional()
  @IsString()
  quotedText?: string;
}
