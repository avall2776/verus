import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateAutomationDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da automação é obrigatório.' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'O tipo de gatilho (triggerType) é obrigatório.' })
  triggerType: string;

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
