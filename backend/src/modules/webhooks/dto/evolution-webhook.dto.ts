import { IsString, IsObject, IsOptional, IsBoolean, IsNumber } from 'class-validator';

class EvolutionMessageKey {
  @IsString()
  remoteJid: string;

  @IsBoolean()
  fromMe: boolean;

  @IsString()
  id: string;
}

class EvolutionMessageData {
  @IsObject()
  key: EvolutionMessageKey;

  @IsObject()
  @IsOptional()
  message?: any; // A estrutura da mensagem pode ser extensa (conversation, extendedTextMessage, imageMessage, etc)

  @IsNumber()
  @IsOptional()
  messageTimestamp?: number;
  
  @IsString()
  @IsOptional()
  pushName?: string;
}

export class EvolutionWebhookDto {
  @IsString()
  event: string; // Ex: "messages.upsert"

  @IsString()
  instance: string;

  @IsObject()
  data: EvolutionMessageData;
}
