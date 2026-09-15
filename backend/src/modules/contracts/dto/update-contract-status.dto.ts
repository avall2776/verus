import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class UpdateContractStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['PENDING_SIGNATURE', 'SIGNED', 'CANCELED', 'pending_signature', 'signed', 'canceled'])
  status: string;

  @IsString()
  @IsOptional()
  signIp?: string;

  @IsString()
  @IsOptional()
  signUserAgent?: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsOptional()
  auditLogUrl?: string;
}
