import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class WhatsappService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { metaToken: true, metaPhoneNumberId: true, whatsappSettings: true }
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    // Return masked token for security
    const maskedToken = tenant.metaToken ? `${tenant.metaToken.substring(0, 15)}...` : null;

    return {
      metaToken: maskedToken,
      hasToken: !!tenant.metaToken,
      metaPhoneNumberId: tenant.metaPhoneNumberId,
      whatsappSettings: tenant.whatsappSettings || {
        antiBanEnabled: true,
        typingDelayMs: 1500,
        messageDelayMs: 3000
      },
      status: !!tenant.metaToken ? 'connected' : 'disconnected'
    };
  }

  async updateConfig(tenantId: string, data: any) {
    const updateData: any = {};
    
    // Se enviou token real (não mascarado), atualiza
    if (data.metaToken && !data.metaToken.includes('...')) {
      updateData.metaToken = data.metaToken;
    }
    
    if (data.metaPhoneNumberId !== undefined) {
      updateData.metaPhoneNumberId = data.metaPhoneNumberId;
    }

    if (data.whatsappSettings) {
      updateData.whatsappSettings = data.whatsappSettings;
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData
    });

    return { success: true };
  }
}
