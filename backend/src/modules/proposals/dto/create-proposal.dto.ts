import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProposalItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Type(() => Number)
  unitPrice: number;
}

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  leadId?: string;

  @IsString()
  @IsOptional()
  dealId?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  @IsOptional()
  items?: CreateProposalItemDto[];
}
