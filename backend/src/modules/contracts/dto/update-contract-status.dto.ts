import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class UpdateContractStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['PENDING_SIGNATURE', 'SIGNED', 'CANCELED'])
  status: 'PENDING_SIGNATURE' | 'SIGNED' | 'CANCELED';

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsOptional()
  auditLogUrl?: string;
}
