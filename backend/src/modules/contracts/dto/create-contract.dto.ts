import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  proposalId: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsOptional()
  auditLogUrl?: string;

  @IsString()
  @IsOptional()
  @IsIn(['PENDING_SIGNATURE', 'SIGNED', 'CANCELED'])
  status?: string;
}
