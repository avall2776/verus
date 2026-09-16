import { IsOptional, IsString } from 'class-validator';

export class QueryTenantsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string; // 'ALL', 'ACTIVE', 'BLOCKED'

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
