import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../shared/database/prisma.service';

export interface SendMessagePayload {
  tenantId: string;
  phone: string;
  content: string;
  instanceId?: string;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dispara uma mensagem de texto via WhatsApp Cloud API Oficial da Meta
   * utilizando a instância ativa configurada para o tenant
   */
  async sendText(payload: SendMessagePayload): Promise<any> {
    try {
      let token: string | null = null;
      let phoneNumberId: string | null = null;

      // 1. Tenta buscar a instância ativa ou específica indicada no payload
      const instance = payload.instanceId
        ? await this.prisma.whatsAppInstance.findFirst({
            where: { id: payload.instanceId, tenantId: payload.tenantId }
          })
        : await this.prisma.whatsAppInstance.findFirst({
            where: { 
              tenantId: payload.tenantId, 
              status: 'connected',
              token: { not: null },
              phoneNumberId: { not: null }
            },
            orderBy: { isDefault: 'desc' }
          });

      if (instance && instance.token && instance.phoneNumberId) {
        token = instance.token;
        phoneNumberId = instance.phoneNumberId;
      } else {
        // Fallback para credenciais salvas no Tenant
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: payload.tenantId },
          select: { metaToken: true, metaPhoneNumberId: true }
        });

        if (tenant?.metaToken && tenant?.metaPhoneNumberId) {
          token = tenant.metaToken;
          phoneNumberId = tenant.metaPhoneNumberId;
        }
      }

      if (!token || !phoneNumberId) {
        this.logger.error(`Credenciais ativas do WhatsApp ausentes para o tenant ${payload.tenantId}`);
        return null;
      }

      // 2. Dispara a mensagem via Graph API do Facebook/Meta
      const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
      
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
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.log(`Mensagem enviada via Meta API com sucesso para ${payload.phone}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Falha ao enviar mensagem Meta para ${payload.phone}: ${error.response?.data?.error?.message || error.message}`);
      return null;
    }
  }
}
