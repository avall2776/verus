import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class TimeClockDto {
  @IsNotEmpty({ message: 'O tipo da batida de ponto é obrigatório.' })
  @IsIn(['ENTRADA', 'PAUSA', 'RETORNO', 'SAIDA'], {
    message: 'Tipo de ponto inválido. Utilize ENTRADA, PAUSA, RETORNO ou SAIDA.',
  })
  type: 'ENTRADA' | 'PAUSA' | 'RETORNO' | 'SAIDA';

  @IsOptional()
  @IsString()
  notes?: string;
}
