import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class SubmitCsatDto {
  @IsInt({ message: 'A avaliação deve ser um número inteiro de 1 a 5.' })
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
