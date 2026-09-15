import { IsString, IsOptional, IsArray, ValidateNested, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProposalItemDto } from './create-proposal.dto';

export class UpdateProposalDto {
  @IsString()
  @IsOptional()
  title?: string;

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

  @IsString()
  @IsOptional()
  @IsIn(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'])
  status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  @IsOptional()
  items?: CreateProposalItemDto[];
}
