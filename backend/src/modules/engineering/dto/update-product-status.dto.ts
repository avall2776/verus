import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateProductStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}
