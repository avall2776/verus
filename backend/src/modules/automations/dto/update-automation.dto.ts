import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAutomationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  triggerType?: string;

  @IsOptional()
  triggerConditions?: any;

  @IsOptional()
  conditions?: any;

  @IsString()
  @IsOptional()
  actionType?: string;

  @IsOptional()
  actionPayload?: any;

  @IsOptional()
  actions?: any;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
