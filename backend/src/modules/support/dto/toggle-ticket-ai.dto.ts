import { IsBoolean } from 'class-validator';

export class ToggleTicketAiDto {
  @IsBoolean()
  isPaused: boolean;
}
