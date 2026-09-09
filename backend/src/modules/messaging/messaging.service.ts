import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

export interface SendMessagePayload {
  tenantId: string;
  phone: string;
  content: string;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private readonly evolutionApiUrl: string;
  private readonly evolutionApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.evolutionApiUrl = this.configService.get<string>('EVOLUTION_API_URL') || 'http://localhost:8080';
    this.evolutionApiKey = this.configService.get<string>('EVOLUTION_API_KEY') || '';
  }

  /**
   * Dispara uma mensagem de texto via Evolution API
   */
  async sendText(payload: SendMessagePayload, instanceName: string = 'default'): Promise<any> {
    try {
      const url = `${this.evolutionApiUrl}/message/sendText/${instanceName}`;
      
      const response = await axios.post(
        url,
        {
          number: payload.phone,
          text: payload.content,
        },
        {
          headers: {
            'apikey': this.evolutionApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.log(`Mensagem enviada com sucesso para ${payload.phone}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Falha ao enviar mensagem para ${payload.phone}: ${error.message}`);
      return null;
    }
  }
}
