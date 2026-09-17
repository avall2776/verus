import { IsArray, IsNotEmpty } from 'class-validator';

export class UpdateChecklistDto {
  @IsArray()
  @IsNotEmpty()
  checklist: Array<{ id: string; text: string; done: boolean }>;
}
