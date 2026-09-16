import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateTenantStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}
