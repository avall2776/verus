import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProposalItemDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  unitPrice?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  discountPercent?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  total?: number;
}

export class CreateProposalDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  clientCompany?: string;

  @IsString()
  @IsOptional()
  clientEmail?: string;

  @IsString()
  @IsOptional()
  clientPhone?: string;

  @IsString()
  @IsOptional()
  sellerName?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  leadId?: string;

  @IsString()
  @IsOptional()
  dealId?: string;

  @IsOptional()
  validUntil?: string;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  discountTotal?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  total?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  publicLink?: string;

  @IsOptional()
  issuer?: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  @IsOptional()
  items?: CreateProposalItemDto[];
}
