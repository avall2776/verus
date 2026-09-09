import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../shared/database/prisma.service';

export interface SendMessagePayload {
  tenantId: string;
  phone: string;
  content: string;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dispara uma mensagem de texto via WhatsApp Cloud API Oficial da Meta
   */
  async sendText(payload: SendMessagePayload): Promise<any> {
    try {
      // 1. Busca as credenciais oficiais da Meta salvas no Tenant
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: payload.tenantId },
        select: { metaToken: true, metaPhoneNumberId: true }
      });

      if (!tenant || !tenant.metaToken || !tenant.metaPhoneNumberId) {
        this.logger.error(`Credenciais da Meta ausentes para o tenant ${payload.tenantId}`);
        return null;
      }

      // 2. Dispara a mensagem via Graph API do Facebook/Meta
      const url = `https://graph.facebook.com/v19.0/${tenant.metaPhoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: payload.phone,
          type: "text",
          text: {
            preview_url: false,
            body: payload.content
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${tenant.metaToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.log(`Mensagem enviada via Meta API com sucesso para ${payload.phone}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Falha ao enviar mensagem Meta para ${payload.phone}: ${error.response?.data?.error?.message || error.message}`);
      return null;
    }
  }
}
