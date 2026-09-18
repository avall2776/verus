import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Garante que o tenant tenha ao menos uma instância padrão
   */
  private async ensureDefaultInstance(tenantId: string) {
    const existing = await this.prisma.whatsAppInstance.findFirst({
      where: { tenantId }
    });

    if (!existing) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { metaToken: true, metaPhoneNumberId: true, whatsappSettings: true }
      });

      return this.prisma.whatsAppInstance.create({
        data: {
          tenantId,
          name: "Linha Principal",
          phoneNumberId: tenant?.metaPhoneNumberId || null,
          token: tenant?.metaToken || null,
          status: tenant?.metaToken ? "connected" : "disconnected",
          profileName: "Atendimento Oficial",
          profilePicUrl: null,
          settings: tenant?.whatsappSettings || {
            antiBanEnabled: true,
            typingDelayMs: 1500,
            messageDelayMs: 3000
          },
          isDefault: true,
          lastConnectedAt: tenant?.metaToken ? new Date() : null,
          history: {
            create: {
              status: tenant?.metaToken ? "connected" : "created",
              details: tenant?.metaToken ? "Instância oficial inicializada e conectada" : "Instância criada aguardando conexão"
            }
          }
        }
      });
    }

    return existing;
  }

  /**
   * Obtém credenciais e URLs de rede seguras para a Evolution API (Baileys)
   */
  public getEvolutionConfig() {
    return {
      serverUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
      apiKey: process.env.EVOLUTION_API_KEY || 'verto123',
      // No Docker da VPS, 172.17.0.1 é a bridge padrão (docker0) que conecta ao host na porta 3001
      webhookBaseUrl: process.env.EVOLUTION_WEBHOOK_URL || 'http://172.17.0.1:3001',
    };
  }

  /**
   * Sanitiza e gera identificador único, alfanumérico e sem espaços para o Baileys
   */
  public getSanitizedInstanceName(tenantId: string, instanceId: string, rawName?: string): string {
    const cleanTenant = (tenantId || 'tenant').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const cleanId = (instanceId || 'inst').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    return `versus_${cleanTenant}_${cleanId}`;
  }

  /**
   * Garante que a instância esteja provisionada na Evolution API e com o Webhook ativo
   */
  public async ensureEvolutionInstance(instanceName: string, tenantId: string) {
    const { serverUrl, apiKey, webhookBaseUrl } = this.getEvolutionConfig();

    try {
      // 1. Verifica se a sessão já existe na Evolution API
      const stateRes = await axios.get(`${serverUrl}/instance/connectionState/${instanceName}`, {
        headers: { apikey: apiKey },
        timeout: 4000,
      }).catch(() => null);

      if (!stateRes?.data?.instance) {
        this.logger.log(`Provisionando nova sessão Baileys na Evolution API: [${instanceName}]`);
        await axios.post(
          `${serverUrl}/instance/create`,
          {
            instanceName,
            token: apiKey,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
            reject_call: false,
            msg_call: '',
            groups_ignore: true,
            always_online: false,
            read_messages: false,
            read_status: false,
            sync_full_history: false,
          },
          {
            headers: { apikey: apiKey, 'Content-Type': 'application/json' },
            timeout: 8000,
          }
        );
      }

      // 2. Registra o Webhook da instância com os eventos essenciais (conexão, QR code e mensagens)
      const webhookUrl = `${webhookBaseUrl}/webhooks/evolution/${tenantId}`;
      await axios.post(
        `${serverUrl}/webhook/set/${instanceName}`,
        {
          enabled: true,
          url: webhookUrl,
          webhook_by_events: false,
          events: [
            'CONNECTION_UPDATE',
            'QRCODE_UPDATED',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'SEND_MESSAGE',
            'CONTACTS_UPSERT',
            'CHATS_UPSERT',
          ],
        },
        {
          headers: { apikey: apiKey, 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );
      this.logger.log(`Webhook Evolution registrado com sucesso para [${instanceName}] -> ${webhookUrl}`);
    } catch (err: any) {
      this.logger.error(`Erro ao provisionar sessão Evolution API [${instanceName}]: ${err.message}`);
      throw err;
    }
  }

  /**
   * Sincroniza instâncias ativas do container Evolution API (Baileys) com o banco de dados do tenant
   */
  private async syncEvolutionInstances(tenantId: string) {
    try {
      const { serverUrl, apiKey, webhookBaseUrl } = this.getEvolutionConfig();

      const res = await axios.get(`${serverUrl}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
        timeout: 4000,
      });

      const evoList = Array.isArray(res.data) ? res.data : [];

      for (const item of evoList) {
        const evo = item.instance || item;
        const instanceName = evo.instanceName;
        if (!instanceName || instanceName.toUpperCase().includes('PROSPECTOR')) continue;

        const isConnected = evo.status === 'open' || evo.connectionStatus === 'open';
        const rawOwner = evo.owner || '';
        const phone = rawOwner.replace(/\D/g, '') || null;

        const existing = await this.prisma.whatsAppInstance.findFirst({
          where: {
            tenantId,
            OR: [
              { settings: { path: ['instanceName'], equals: instanceName } },
              { name: instanceName },
              { name: `${instanceName} (WhatsApp Web)` },
            ],
          },
        });

        if (!existing) {
          await this.prisma.whatsAppInstance.create({
            data: {
              tenantId,
              name: `${instanceName} (WhatsApp Web)`,
              phoneNumber: phone,
              profileName: evo.profileName || 'WhatsApp Baileys',
              profilePicUrl: evo.profilePictureUrl || null,
              status: isConnected ? 'connected' : 'disconnected',
              token: evo.apikey || apiKey,
              phoneNumberId: null,
              isDefault: false,
              settings: {
                provider: 'evolution',
                instanceName: instanceName,
                serverUrl: serverUrl,
                antiBanEnabled: true,
                typingDelayMs: 1200,
                messageDelayMs: 2500,
              },
              lastConnectedAt: isConnected ? new Date() : null,
              history: {
                create: {
                  status: isConnected ? 'connected' : 'created',
                  details: `Instância Baileys sincronizada da Evolution API [${instanceName}]`,
                },
              },
            },
          });
        } else {
          await this.prisma.whatsAppInstance.update({
            where: { id: existing.id },
            data: {
              status: isConnected ? 'connected' : existing.status,
              profilePicUrl: evo.profilePictureUrl || existing.profilePicUrl,
              profileName: evo.profileName || existing.profileName,
              phoneNumber: phone || existing.phoneNumber,
              lastConnectedAt: isConnected ? new Date() : existing.lastConnectedAt,
            },
          });
        }

        // Garante webhook configurado no Evolution API com endereço bridge 172.17.0.1
        try {
          const webhookUrl = `${webhookBaseUrl}/webhooks/evolution/${tenantId}`;
          await axios.post(
            `${serverUrl}/webhook/set/${instanceName}`,
            {
              enabled: true,
              url: webhookUrl,
              webhook_by_events: false,
              events: [
                'CONNECTION_UPDATE',
                'QRCODE_UPDATED',
                'MESSAGES_UPSERT',
                'MESSAGES_UPDATE',
                'SEND_MESSAGE',
                'CONTACTS_UPSERT',
                'CHATS_UPSERT',
              ],
            },
            {
              headers: { apikey: apiKey, 'Content-Type': 'application/json' },
              timeout: 4000,
            },
          );
        } catch {}
      }
    } catch (err: any) {
      this.logger.debug(`Sincronização de instâncias Evolution API ignorada: ${err.message}`);
    }
  }

  /**
   * Lista todas as instâncias WhatsApp de um workspace/tenant
   */
  async getInstances(tenantId: string) {
    await this.ensureDefaultInstance(tenantId);
    await this.syncEvolutionInstances(tenantId);

    const instances = await this.prisma.whatsAppInstance.findMany({
      where: { tenantId },
      include: {
        history: {
          take: 10,
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return instances.map(inst => ({
      ...inst,
      token: inst.token ? `${inst.token.substring(0, 12)}...` : null,
      hasToken: !!inst.token
    }));
  }

  /**
   * Obtém detalhes de uma instância específica com histórico completo
   */
  async getInstanceById(tenantId: string, id: string) {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id, tenantId },
      include: {
        history: {
          take: 30,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!instance) {
      throw new NotFoundException('Instância do WhatsApp não encontrada.');
    }

    return {
      ...instance,
      token: instance.token ? `${instance.token.substring(0, 12)}...` : null,
      hasToken: !!instance.token
    };
  }

  /**
   * Cria uma nova instância para o workspace
   */
  async createInstance(tenantId: string, data: any) {
    if (data.isDefault) {
      await this.prisma.whatsAppInstance.updateMany({
        where: { tenantId },
        data: { isDefault: false }
      });
    }

    const instance = await this.prisma.whatsAppInstance.create({
      data: {
        tenantId,
        name: data.name || "Nova Linha WhatsApp",
        phoneNumber: data.phoneNumber || null,
        phoneNumberId: data.phoneNumberId || null,
        token: data.token || null,
        profileName: data.profileName || null,
        profilePicUrl: data.profilePicUrl || null,
        status: data.token ? "connected" : "disconnected",
        isDefault: data.isDefault ?? false,
        settings: data.settings || {
          antiBanEnabled: true,
          typingDelayMs: 1500,
          messageDelayMs: 3000
        },
        history: {
          create: {
            status: "created",
            details: `Instância criada: ${data.name || "Nova Linha"}`
          }
        }
      }
    });

    return instance;
  }

  /**
   * Atualiza dados e configurações da instância
   */
  async updateInstance(tenantId: string, id: string, data: any) {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id, tenantId }
    });

    if (!instance) {
      throw new NotFoundException('Instância não encontrada.');
    }

    if (data.isDefault) {
      await this.prisma.whatsAppInstance.updateMany({
        where: { tenantId, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.phoneNumberId !== undefined) updateData.phoneNumberId = data.phoneNumberId;
    if (data.profileName !== undefined) updateData.profileName = data.profileName;
    if (data.profilePicUrl !== undefined) updateData.profilePicUrl = data.profilePicUrl;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.settings !== undefined) updateData.settings = data.settings;

    // Atualiza token apenas se enviado e não mascarado
    if (data.token && !data.token.includes('...')) {
      updateData.token = data.token;
      updateData.status = 'connected';
      updateData.lastConnectedAt = new Date();
    }

    const updated = await this.prisma.whatsAppInstance.update({
      where: { id },
      data: updateData
    });

    // Se for a instância padrão, reflete também no Tenant para retrocompatibilidade
    if (updated.isDefault) {
      const tenantUpdate: any = {};
      if (updateData.token) tenantUpdate.metaToken = updateData.token;
      if (updateData.phoneNumberId) tenantUpdate.metaPhoneNumberId = updateData.phoneNumberId;
      if (updateData.settings) tenantUpdate.whatsappSettings = updateData.settings;
      if (Object.keys(tenantUpdate).length > 0) {
        await this.prisma.tenant.update({
          where: { id: tenantId },
          data: tenantUpdate
        });
      }
    }

    this.chatGateway.emitWhatsAppStatusUpdated(tenantId, updated);

    return updated;
  }

  /**
   * Remove uma instância
   */
  async deleteInstance(tenantId: string, id: string) {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id, tenantId }
    });

    if (!instance) {
      throw new NotFoundException('Instância não encontrada.');
    }

    if (instance.isDefault) {
      throw new BadRequestException('Não é permitido excluir a instância principal do workspace.');
    }

    await this.prisma.whatsAppInstance.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Conecta / gera QR code para pareamento dinâmico
   */
  async connectInstance(tenantId: string, id: string, mode: 'qr' | 'meta' = 'meta') {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id, tenantId }
    });

    if (!instance) {
      throw new NotFoundException('Instância não encontrada.');
    }

    if (mode === 'qr') {
      const { serverUrl, apiKey } = this.getEvolutionConfig();
      const currentSettings = (instance.settings as any) || {};
      const instanceName = currentSettings.instanceName || this.getSanitizedInstanceName(tenantId, id, instance.name);

      // Salva instanceName nas configurações da instância no banco se ainda não estiver salvo
      if (currentSettings.instanceName !== instanceName) {
        await this.prisma.whatsAppInstance.update({
          where: { id },
          data: {
            settings: {
              ...currentSettings,
              provider: 'evolution',
              instanceName,
            }
          }
        });
      }

      let qrCodeToUse: string | null = null;

      try {
        // 1. Assegura que a sessão existe na Evolution API e o webhook está cadastrado
        await this.ensureEvolutionInstance(instanceName, tenantId);

        // Aguarda 1.2s para o Baileys iniciar o socket local
        await new Promise((resolve) => setTimeout(resolve, 1200));

        // 2. Consulta o QR Code gerado pelo Baileys
        const evoRes = await axios.get(`${serverUrl}/instance/connect/${instanceName}`, {
          headers: { apikey: apiKey },
          timeout: 10000,
        });

        if (evoRes.data?.base64) {
          qrCodeToUse = evoRes.data.base64;
        } else if (evoRes.data?.code) {
          qrCodeToUse = evoRes.data.code;
        } else if (evoRes.data?.qrcode?.base64) {
          qrCodeToUse = evoRes.data.qrcode.base64;
        } else if (evoRes.data?.qrcode?.code) {
          qrCodeToUse = evoRes.data.qrcode.code;
        }
      } catch (evoErr: any) {
        this.logger.error(`Erro ao conectar instância Baileys na Evolution API [${instanceName}]: ${evoErr.message}`);
      }

      if (!qrCodeToUse) {
        throw new BadRequestException('Não foi possível obter o QR Code no servidor do WhatsApp Baileys. Verifique se o serviço está ativo.');
      }

      const updated = await this.prisma.whatsAppInstance.update({
        where: { id },
        data: {
          status: 'qrcode',
          qrCode: qrCodeToUse
        }
      });

      await this.prisma.whatsAppConnectionHistory.create({
        data: {
          instanceId: id,
          status: 'connecting',
          details: 'Código QR autêntico gerado pelo Baileys aguardando leitura no aplicativo WhatsApp'
        }
      });

      this.chatGateway.emitWhatsAppStatusUpdated(tenantId, updated);

      return {
        status: 'qrcode',
        qrCode: qrCodeToUse,
        message: 'Aponte a câmera do WhatsApp para o QR Code gerado'
      };
    }

    // Modo Meta Cloud API
    if (!instance.token && !instance.phoneNumberId) {
      throw new BadRequestException('Informe o Access Token e Phone Number ID para conectar via Meta API.');
    }

    const updated = await this.prisma.whatsAppInstance.update({
      where: { id },
      data: {
        status: 'connected',
        lastConnectedAt: new Date()
      }
    });

    await this.prisma.whatsAppConnectionHistory.create({
      data: {
        instanceId: id,
        status: 'connected',
        details: 'Conexão restabelecida com a Graph API do WhatsApp'
      }
    });

    this.chatGateway.emitWhatsAppStatusUpdated(tenantId, updated);

    return {
      status: 'connected',
      message: 'Instância conectada com sucesso!'
    };
  }

  /**
   * Conclui pareamento via QR Code (celular ou simulação)
   */
  async pairInstance(tenantId: string, id: string, phoneNumber?: string) {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id, tenantId }
    });

    if (!instance) {
      throw new NotFoundException('Instância não encontrada.');
    }

    const assignedPhone = phoneNumber || instance.phoneNumber || '5549999999999';

    const updated = await this.prisma.whatsAppInstance.update({
      where: { id },
      data: {
        status: 'connected',
        phoneNumber: assignedPhone,
        qrCode: null,
        lastConnectedAt: new Date()
      }
    });

    await this.prisma.whatsAppConnectionHistory.create({
      data: {
        instanceId: id,
        status: 'connected',
        details: 'Pareamento via QR Code concluído com sucesso pelo aparelho celular'
      }
    });

    this.chatGateway.emitWhatsAppStatusUpdated(tenantId, updated);

    return {
      status: 'connected',
      message: 'Instância pareada com sucesso!',
      instance: updated
    };
  }

  /**
   * Desconecta uma instância
   */
  async disconnectInstance(tenantId: string, id: string) {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id, tenantId }
    });

    if (!instance) {
      throw new NotFoundException('Instância não encontrada.');
    }

    const currentSettings = (instance.settings as any) || {};
    const instanceName = currentSettings.instanceName || this.getSanitizedInstanceName(tenantId, id, instance.name);
    const { serverUrl, apiKey } = this.getEvolutionConfig();

    try {
      await axios.delete(`${serverUrl}/instance/logout/${instanceName}`, {
        headers: { apikey: apiKey },
        timeout: 4000,
      }).catch(() => null);
    } catch (e) {}

    const updated = await this.prisma.whatsAppInstance.update({
      where: { id },
      data: {
        status: 'disconnected',
        qrCode: null
      }
    });

    await this.prisma.whatsAppConnectionHistory.create({
      data: {
        instanceId: id,
        status: 'disconnected',
        details: 'Sessão desconectada e encerrada na Evolution API'
      }
    });

    this.chatGateway.emitWhatsAppStatusUpdated(tenantId, updated);

    return {
      status: 'disconnected',
      message: 'Instância desconectada com sucesso.'
    };
  }

  /**
   * Retrocompatibilidade com rotas legadas /whatsapp/config
   */
  async getConfig(tenantId: string) {
    const defaultInst = await this.ensureDefaultInstance(tenantId);
    const maskedToken = defaultInst.token ? `${defaultInst.token.substring(0, 15)}...` : null;

    return {
      metaToken: maskedToken,
      hasToken: !!defaultInst.token,
      metaPhoneNumberId: defaultInst.phoneNumberId,
      instanceId: defaultInst.id,
      instanceName: defaultInst.name,
      profilePicUrl: defaultInst.profilePicUrl,
      whatsappSettings: defaultInst.settings || {
        antiBanEnabled: true,
        typingDelayMs: 1500,
        messageDelayMs: 3000
      },
      status: defaultInst.status
    };
  }

  /**
   * Retrocompatibilidade com atualização legada /whatsapp/config
   */
  async updateConfig(tenantId: string, data: any) {
    const defaultInst = await this.ensureDefaultInstance(tenantId);
    return this.updateInstance(tenantId, defaultInst.id, {
      token: data.metaToken,
      phoneNumberId: data.metaPhoneNumberId,
      settings: data.whatsappSettings
    });
  }

  /**
   * Busca a foto de perfil real do contato direto na API oficial do WhatsApp (Meta Graph API).
   * Se a API do WhatsApp retornar a foto real, salva e retorna a URL.
   * Caso contrário, retorna null para que o frontend caia no componente de iniciais nativo (ex: FC).
   */
  async fetchContactProfilePicture(tenantId: string, phone: string): Promise<string | null> {
    const cleanPhone = phone.replace(/\D/g, '');

    try {
      const instance = await this.prisma.whatsAppInstance.findFirst({
        where: {
          tenantId,
          status: 'connected',
          token: { not: null },
          phoneNumberId: { not: null }
        },
        orderBy: { isDefault: 'desc' }
      });

      let token = instance?.token;
      if (!token) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { metaToken: true }
        });
        token = tenant?.metaToken || null;
      }

      if (token) {
        try {
          const res = await axios.get(
            `https://graph.facebook.com/v19.0/${cleanPhone}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: { fields: 'profile_picture_url' },
              timeout: 4000
            }
          );
          if (res.data?.profile_picture_url) {
            return res.data.profile_picture_url;
          }
        } catch (metaErr) {
          // Sem foto pública ou permissão restrita da Meta para este número
        }
      }
    } catch (e) {
      // Ignora erro
    }

    // Retorna explicitamente null para exibir as iniciais reais
    return null;
  }

  /**
   * Sincroniza e atualiza o avatar do contato no banco de dados se a API do WhatsApp retornar foto real.
   * Remove fotos fictícias e mantém null caso o contato não tenha foto real no WhatsApp.
   */
  async syncContactAvatar(tenantId: string, contactId: string): Promise<string | null> {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, tenantId }
    });

    if (!contact || !contact.phone) return null;

    // Se já tinha URL do Unsplash ou foto fictícia antiga, limpa para null
    if (contact.avatarUrl && contact.avatarUrl.includes('unsplash.com')) {
      await this.prisma.contact.update({
        where: { id: contactId },
        data: { avatarUrl: null }
      });
      contact.avatarUrl = null;
    }

    if (contact.avatarUrl) return contact.avatarUrl;

    const avatarUrl = await this.fetchContactProfilePicture(tenantId, contact.phone);
    if (avatarUrl) {
      await this.prisma.contact.update({
        where: { id: contactId },
        data: { avatarUrl }
      });
      return avatarUrl;
    }

    return null;
  }

  /**
   * Baixa a mídia da Meta Graph API e salva localmente em disco,
   * retornando a URL pública relativa para streaming no chat
   */
  async downloadAndSaveMedia(tenantId: string, mediaId: string, mimeType: string = 'audio/ogg'): Promise<string | null> {
    try {
      let token: string | null = null;
      const instance = await this.prisma.whatsAppInstance.findFirst({
        where: {
          tenantId,
          status: 'connected',
          token: { not: null }
        },
        orderBy: { isDefault: 'desc' }
      });

      if (instance?.token) {
        token = instance.token;
      } else {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { metaToken: true }
        });
        token = tenant?.metaToken || null;
      }

      if (!token) {
        this.logger.warn(`Token ausente para download da mídia ${mediaId} no tenant ${tenantId}`);
        return null;
      }

      // 1. Consulta URL de download na Meta
      const metaRes = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      const downloadUrl = metaRes.data?.url;
      if (!downloadUrl) {
        this.logger.warn(`URL não retornada na consulta de mídia ${mediaId}`);
        return null;
      }

      // 2. Faz o download do arquivo binário
      const mediaRes = await axios.get(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
        timeout: 15000
      });

      // 3. Salva no disco
      const isOgg = mimeType.includes('ogg') || mimeType.includes('opus');
      const isMp4 = mimeType.includes('mp4') || mimeType.includes('m4a');
      const isMp3 = mimeType.includes('mpeg') || mimeType.includes('mp3');
      const ext = isOgg ? 'ogg' : isMp4 ? 'm4a' : isMp3 ? 'mp3' : 'ogg';

      const filename = `inbound_${Date.now()}_${mediaId.substring(0, 8)}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, Buffer.from(mediaRes.data));

      this.logger.log(`Mídia [${mediaId}] baixada e armazenada com sucesso: ${filePath}`);
      return `/api-backend/media/audio/${filename}`;
    } catch (err: any) {
      this.logger.error(`Falha ao baixar mídia Meta ${mediaId}: ${err.message}`);
      return null;
    }
  }
}


