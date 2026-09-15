import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateProposalStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'])
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
}
