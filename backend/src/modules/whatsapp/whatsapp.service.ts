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
          webhook_base64: true,
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

      const cleanTenant = (tenantId || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);

      for (const item of evoList) {
        const evo = item.instance || item;
        const instanceName = evo.instanceName;
        if (!instanceName || instanceName.toUpperCase().includes('PROSPECTOR')) continue;

        // Isola estritamente instâncias por tenant - impede que um tenant clone instâncias de outro
        if (instanceName.startsWith('versus_')) {
          const parts = instanceName.split('_');
          const instTenantPrefix = parts[1];
          if (instTenantPrefix && instTenantPrefix !== cleanTenant) {
            // Pertence a outro tenant! Não sincroniza nem sobrescreve webhook.
            continue;
          }
        } else {
          // Se a instância não tem o prefixo padronizado versus_, só sincroniza se já pertencer a este tenant no banco
          const belongsToCurrentTenant = await this.prisma.whatsAppInstance.findFirst({
            where: {
              tenantId,
              OR: [
                { settings: { path: ['instanceName'], equals: instanceName } },
                { name: instanceName },
                { name: `${instanceName} (WhatsApp Web)` },
              ],
            },
            select: { id: true },
          });
          if (!belongsToCurrentTenant) {
            // Instância externa ou de outro tenant sem prefixo - JAMAIS clonar para este tenant!
            continue;
          }
        }

        const isConnected = evo.status === 'open' || evo.connectionStatus === 'open';
        const rawOwner = evo.owner || '';
        const phone = rawOwner.replace(/\D/g, '') || null;

        let existing = await this.prisma.whatsAppInstance.findFirst({
          where: {
            tenantId,
            OR: [
              { settings: { path: ['instanceName'], equals: instanceName } },
              { name: instanceName },
              { name: `${instanceName} (WhatsApp Web)` },
            ],
          },
        });

        // Se não achou pelo nome ou settings, busca pelo prefixo do ID gerado no nome técnico
        if (!existing && instanceName.startsWith('versus_')) {
          const parts = instanceName.split('_');
          const instIdPrefix = parts[2];
          if (instIdPrefix) {
            const allInsts = await this.prisma.whatsAppInstance.findMany({ where: { tenantId } });
            existing = allInsts.find(i => i.id.replace(/[^a-zA-Z0-9]/g, '').startsWith(instIdPrefix)) || null;
          }
        }

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
          const currentSettings = (existing.settings as any) || {};
          await this.prisma.whatsAppInstance.update({
            where: { id: existing.id },
            data: {
              status: isConnected ? 'connected' : (existing.status === 'qrcode' ? 'qrcode' : 'disconnected'),
              profilePicUrl: evo.profilePictureUrl || existing.profilePicUrl,
              profileName: evo.profileName || existing.profileName,
              phoneNumber: phone || existing.phoneNumber,
              lastConnectedAt: isConnected ? new Date() : existing.lastConnectedAt,
              settings: {
                ...currentSettings,
                provider: 'evolution',
                instanceName: instanceName,
                serverUrl: serverUrl,
              },
            },
          });
        }

        // Garante webhook configurado no Evolution API com endereço bridge 172.17.0.1 e webhook_base64 ativado
        try {
          const webhookUrl = `${webhookBaseUrl}/webhooks/evolution/${tenantId}`;
          await axios.post(
            `${serverUrl}/webhook/set/${instanceName}`,
            {
              enabled: true,
              url: webhookUrl,
              webhook_by_events: false,
              webhook_base64: true,
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
   * Sincroniza ativamente o status de uma instância com a Evolution API e restabelece socket se desconectado
   */
  async syncInstanceStatus(tenantId: string, id: string) {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id, tenantId },
    });

    if (!instance) {
      throw new NotFoundException('Instância não encontrada.');
    }

    const currentSettings = (instance.settings as any) || {};
    const instanceName = currentSettings.instanceName || this.getSanitizedInstanceName(tenantId, id, instance.name);
    const { serverUrl, apiKey } = this.getEvolutionConfig();

    try {
      // 1. Consulta o estado real da conexão na Evolution API
      const stateRes = await axios.get(`${serverUrl}/instance/connectionState/${instanceName}`, {
        headers: { apikey: apiKey },
        timeout: 5000,
      }).catch(() => null);

      const evoState = stateRes?.data?.instance?.state || stateRes?.data?.state;
      const isConnected = evoState === 'open' || evoState === 'connected';

      let newStatus: string = isConnected ? 'connected' : 'disconnected';
      let phone = instance.phoneNumber;

      if (isConnected) {
        const owner = stateRes?.data?.instance?.owner || stateRes?.data?.owner;
        if (owner) {
          phone = String(owner).replace(/\D/g, '') || phone;
        }
      } else {
        // Se estiver desconectado, tenta acionar a conexão para o Baileys iniciar o socket
        try {
          await axios.get(`${serverUrl}/instance/connect/${instanceName}`, {
            headers: { apikey: apiKey },
            timeout: 5000,
          });
        } catch (reconnErr) {}
      }

      const updated = await this.prisma.whatsAppInstance.update({
        where: { id: instance.id },
        data: {
          status: newStatus,
          phoneNumber: phone,
          lastConnectedAt: isConnected ? new Date() : instance.lastConnectedAt,
        },
      });

      await this.prisma.whatsAppConnectionHistory.create({
        data: {
          instanceId: instance.id,
          status: isConnected ? 'connected' : 'disconnected',
          details: `Sincronização ativa executada. Estado na Evolution API: ${evoState || 'fechado/ausente'}`,
        },
      });

      this.chatGateway.emitWhatsAppStatusUpdated(tenantId, updated);

      // Dispara resolução em background de contatos com @lid para números reais
      this.syncAndResolveLidContacts(tenantId).catch(() => {});

      return {
        success: true,
        status: newStatus,
        instance: updated,
        message: isConnected ? 'Instância sincronizada e conectada com sucesso!' : 'Instância desconectada no WhatsApp. Gere um novo QR Code para parear.',
      };
    } catch (err: any) {
      this.logger.error(`Erro ao sincronizar status da instância [${id}]: ${err.message}`);
      throw new BadRequestException(`Falha ao sincronizar com o servidor WhatsApp: ${err.message}`);
    }
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
   * Consulta os metadados do contato (nome real de exibição e foto de perfil)
   * suportando tanto Evolution API (Baileys / QR Code) quanto Meta Cloud API.
   */
  async fetchContactProfile(tenantId: string, phone: string): Promise<{ name?: string | null; avatarUrl?: string | null }> {
    const cleanPhone = phone.replace(/\D/g, '');
    let resolvedName: string | null = null;
    let resolvedAvatar: string | null = null;

    // 1. Tentar obter via Evolution API (Baileys) se houver instância conectada ou configurada
    try {
      const evoConfig = this.getEvolutionConfig();
      const instances = await this.prisma.whatsAppInstance.findMany({
        where: { tenantId },
        orderBy: { isDefault: 'desc' }
      });

      const connectedInst = instances.find(i => i.status === 'connected') || instances[0];
      let instanceName: string | null = null;

      if (connectedInst) {
        const set = (connectedInst.settings as any) || {};
        instanceName = set.instanceName || connectedInst.name || this.getSanitizedInstanceName(tenantId, connectedInst.id);
      }

      if (instanceName) {
        const headers = { apikey: evoConfig.apiKey, 'Content-Type': 'application/json' };
        const queryNumber = phone.includes('@') ? phone : cleanPhone;

        // 1.1 Consulta Foto de Perfil via Evolution API
        try {
          const picRes = await axios.post(
            `${evoConfig.serverUrl}/chat/fetchProfilePictureUrl/${instanceName}`,
            { number: queryNumber },
            { headers, timeout: 5000 }
          );
          if (picRes.data?.profilePictureUrl) {
            resolvedAvatar = picRes.data.profilePictureUrl;
          }
        } catch (picErr) {
          // Ignora erro específico de foto
        }

        // 1.2 Consulta Perfil (Nome e Foto) via Evolution API
        try {
          const profRes = await axios.post(
            `${evoConfig.serverUrl}/chat/fetchProfile/${instanceName}`,
            { number: queryNumber },
            { headers, timeout: 5000 }
          );
          if (profRes.data?.name && !profRes.data.name.includes('@lid')) {
            resolvedName = profRes.data.name;
          }
          if (!resolvedAvatar && profRes.data?.picture) {
            resolvedAvatar = profRes.data.picture;
          }
        } catch (profErr) {
          // Ignora erro
        }

        // 1.3 Se ainda não encontrou nome ou foto, busca nos contatos salvos da instância
        if (!resolvedName || !resolvedAvatar) {
          try {
            const contactsRes = await axios.post(
              `${evoConfig.serverUrl}/chat/findContacts/${instanceName}`,
              { where: { id: phone.includes('@') ? phone : `${cleanPhone}@s.whatsapp.net` } },
              { headers, timeout: 4000 }
            );
            const found = Array.isArray(contactsRes.data) ? contactsRes.data[0] : contactsRes.data;
            if (found) {
              if (!resolvedName && (found.pushName || found.name || found.verifiedName)) {
                resolvedName = found.pushName || found.name || found.verifiedName;
              }
              if (!resolvedAvatar && (found.profilePictureUrl || found.picture)) {
                resolvedAvatar = found.profilePictureUrl || found.picture;
              }
            }
          } catch (contactErr) {}
        }

        // 1.4 Se for @lid e ainda não tiver nome ou foto, verifica outras instâncias Evolution ativas no servidor (ex: PROSPECTOR)
        if (phone.includes('@lid') && (!resolvedName || !resolvedAvatar)) {
          try {
            const allInstRes = await axios.get(`${evoConfig.serverUrl}/instance/fetchInstances`, { headers, timeout: 3000 }).catch(() => null);
            const allInstances = Array.isArray(allInstRes?.data) ? allInstRes.data : [];
            for (const other of allInstances) {
              const otherName = other.name || other.instanceName;
              if (otherName && otherName !== instanceName && (other.connectionStatus === 'open' || other.status === 'open')) {
                if (!resolvedAvatar) {
                  const pRes = await axios.post(`${evoConfig.serverUrl}/chat/fetchProfilePictureUrl/${otherName}`, { number: queryNumber }, { headers, timeout: 3000 }).catch(() => null);
                  if (pRes?.data?.profilePictureUrl) resolvedAvatar = pRes.data.profilePictureUrl;
                }
                if (!resolvedName) {
                  const cRes = await axios.post(`${evoConfig.serverUrl}/chat/findContacts/${otherName}`, { where: { id: queryNumber } }, { headers, timeout: 3000 }).catch(() => null);
                  const f = Array.isArray(cRes?.data) ? cRes.data[0] : null;
                  if (f?.pushName || f?.name) resolvedName = f.pushName || f.name;
                }
                if (resolvedName && resolvedAvatar) break;
              }
            }
          } catch (e) {}
        }
      }
    } catch (evoErr: any) {
      this.logger.debug(`Evolution profile fetch skipped or failed: ${evoErr.message}`);
    }

    // 2. Se for conexão Meta Graph API (oficial) e ainda não tiver avatar
    if (!resolvedAvatar && cleanPhone) {
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
          const res = await axios.get(
            `https://graph.facebook.com/v19.0/${cleanPhone}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: { fields: 'profile_picture_url' },
              timeout: 4000
            }
          );
          if (res.data?.profile_picture_url) {
            resolvedAvatar = res.data.profile_picture_url;
          }
        }
      } catch (metaErr) {}
    }

    return {
      name: resolvedName && !resolvedName.includes('@lid') ? resolvedName : null,
      avatarUrl: resolvedAvatar && !resolvedAvatar.includes('unsplash.com') ? resolvedAvatar : null
    };
  }

  /**
   * Sincroniza metadados do contato (nome real e avatar) com a API do WhatsApp (Evolution/Meta).
   * Persiste no banco de dados e emite atualização em tempo real para os clientes conectados via WebSocket.
   */
  async syncContactMetadata(tenantId: string, contactId: string): Promise<{ name: string | null; avatarUrl: string | null } | null> {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, tenantId }
    });

    if (!contact || !contact.phone) return null;

    // Limpa fotos fictícias antigas
    if (contact.avatarUrl && contact.avatarUrl.includes('unsplash.com')) {
      await this.prisma.contact.update({
        where: { id: contactId },
        data: { avatarUrl: null }
      });
      contact.avatarUrl = null;
    }

    const isGenericName = !contact.name || contact.name === 'Cliente WhatsApp' || contact.name.includes('@lid') || contact.name.startsWith('WhatsApp');
    const needsAvatar = !contact.avatarUrl;

    if (!isGenericName && !needsAvatar) {
      return { name: contact.name, avatarUrl: contact.avatarUrl };
    }

    const profile = await this.fetchContactProfile(tenantId, contact.phone);
    const updateData: any = {};

    if (profile.name && isGenericName) {
      updateData.name = profile.name;
    }
    if (profile.avatarUrl && needsAvatar) {
      updateData.avatarUrl = profile.avatarUrl;
    }

    if (Object.keys(updateData).length > 0) {
      const updated = await this.prisma.contact.update({
        where: { id: contactId },
        data: updateData
      });

      this.logger.log(`Metadados do contato [${contact.phone}] sincronizados: Nome='${updated.name}', Avatar=${!!updated.avatarUrl}`);
      this.chatGateway.emitContactUpdated(tenantId, updated);

      return { name: updated.name, avatarUrl: updated.avatarUrl };
    }

    return { name: contact.name, avatarUrl: contact.avatarUrl };
  }

  /**
   * Busca a foto de perfil real do contato (Evolution API ou Meta API).
   */
  async fetchContactProfilePicture(tenantId: string, phone: string): Promise<string | null> {
    const profile = await this.fetchContactProfile(tenantId, phone);
    return profile.avatarUrl || null;
  }

  /**
   * Sincroniza e atualiza o avatar do contato no banco de dados se a API do WhatsApp retornar foto real.
   */
  async syncContactAvatar(tenantId: string, contactId: string): Promise<string | null> {
    const result = await this.syncContactMetadata(tenantId, contactId);
    return result?.avatarUrl || null;
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

      // 3. Salva no disco de acordo com o tipo MIME
      const isAudio = mimeType.includes('audio') || mimeType.includes('ogg') || mimeType.includes('opus') || mimeType.includes('mp3') || mimeType.includes('mp4') || mimeType.includes('m4a');
      const isImage = mimeType.includes('image');
      const isPdf = mimeType.includes('pdf');

      let folder = 'media';
      let ext = 'bin';

      if (isAudio) {
        folder = 'audio';
        ext = mimeType.includes('mp3') ? 'mp3' : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'ogg';
      } else if (isImage) {
        folder = 'media';
        ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      } else if (isPdf) {
        folder = 'media';
        ext = 'pdf';
      }

      const safeId = (mediaId || `${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 16);
      const filename = `inbound_${Date.now()}_${safeId}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'uploads', folder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, Buffer.from(mediaRes.data));

      this.logger.log(`Mídia Meta [${mediaId}] (${mimeType}) baixada com sucesso: ${filePath}`);
      return folder === 'audio' ? `/api-backend/media/audio/${filename}` : `/api-backend/media/file/${filename}`;
    } catch (err: any) {
      this.logger.error(`Falha ao baixar mídia Meta ${mediaId}: ${err.message}`);
      return null;
    }
  }

  /**
   * Baixa a mídia da Evolution API (Baileys) via /chat/getBase64FromMediaMessage
   * quando a mensagem recebida for áudio, imagem ou documento e não contiver base64 inline.
   */
  async getBase64FromEvolutionMedia(instanceName: string, messageObj: any, key: any): Promise<string | null> {
    try {
      const cleanName = (instanceName || '').replace(' (WhatsApp Web)', '').trim();
      const { serverUrl, apiKey } = this.getEvolutionConfig();
      const res = await axios.post(
        `${serverUrl}/chat/getBase64FromMediaMessage/${cleanName}`,
        {
          message: {
            key,
            message: messageObj,
          },
          convertToMp4: false,
        },
        {
          headers: { apikey: apiKey, 'Content-Type': 'application/json' },
          timeout: 12000,
        }
      );
      return res.data?.base64 || null;
    } catch (err: any) {
      this.logger.warn(`Não foi possível extrair base64 da Evolution API para instância [${instanceName}]: ${err.message}`);
      return null;
    }
  }

  /**
   * Salva em disco qualquer buffer de mídia (áudio, imagem, documento) codificado em base64
   * e retorna a URL pública acessível para chat e visualização.
   */
  async saveBase64Media(
    tenantId: string,
    base64Data: string,
    messageId: string,
    mimeType: string = 'application/octet-stream',
    originalFilename?: string,
  ): Promise<{ url: string; filePath: string; buffer: Buffer } | null> {
    try {
      const cleanBase64 = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
      const buffer = Buffer.from(cleanBase64, 'base64');

      const isAudio = mimeType.includes('audio') || mimeType.includes('ogg') || mimeType.includes('opus') || mimeType.includes('mp3') || mimeType.includes('mp4') || mimeType.includes('m4a');
      const isImage = mimeType.includes('image');
      const isPdf = mimeType.includes('pdf');

      let folder = 'media';
      let ext = 'bin';

      if (isAudio) {
        folder = 'audio';
        ext = mimeType.includes('mp3') ? 'mp3' : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'ogg';
      } else if (isImage) {
        folder = 'media';
        ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      } else if (isPdf) {
        folder = 'media';
        ext = 'pdf';
      } else if (originalFilename && originalFilename.includes('.')) {
        folder = 'media';
        ext = originalFilename.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
      }

      const safeId = (messageId || `${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 16);
      const filename = originalFilename && !isAudio
        ? `inbound_${Date.now()}_${path.basename(originalFilename).replace(/[^a-zA-Z0-9._-]/g, '')}`
        : `inbound_${Date.now()}_${safeId}.${ext}`;

      const uploadDir = path.join(process.cwd(), 'uploads', folder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, buffer);

      const url = folder === 'audio' ? `/api-backend/media/audio/${filename}` : `/api-backend/media/file/${filename}`;
      this.logger.log(`Mídia [${mimeType}] gravada com sucesso: ${filePath} (${buffer.length} bytes)`);

      return { url, filePath, buffer };
    } catch (err: any) {
      this.logger.error(`Erro ao salvar mídia base64: ${err.message}`);
      return null;
    }
  }

  /**
   * Salva em disco um buffer de áudio codificado em base64 recebido pelo webhook da Evolution API
   * (Mantido para retrocompatibilidade)
   */
  async saveBase64Audio(tenantId: string, base64Data: string, messageId: string, mimeType: string = 'audio/ogg'): Promise<string | null> {
    const res = await this.saveBase64Media(tenantId, base64Data, messageId, mimeType);
    return res?.url || null;
  }

  /**
   * Apaga uma mensagem enviada para todos no WhatsApp ("Revoke / Delete for Everyone")
   */
  async deleteMessageForEveryone(
    tenantId: string,
    instanceName: string,
    remoteJid: string,
    providerMessageId: string
  ): Promise<boolean> {
    try {
      const cleanName = (instanceName || '').replace(' (WhatsApp Web)', '').trim();
      const { serverUrl, apiKey } = this.getEvolutionConfig();

      const targetJid = remoteJid.includes('@') ? remoteJid : `${remoteJid.replace(/\D/g, '')}@s.whatsapp.net`;

      // Chamada Evolution API v2 para deletar para todos
      await axios.delete(
        `${serverUrl}/chat/deleteMessageForEveryone/${cleanName}`,
        {
          headers: { apikey: apiKey, 'Content-Type': 'application/json' },
          data: {
            id: providerMessageId,
            remoteJid: targetJid,
            fromMe: true,
          },
          timeout: 8000,
        }
      ).catch(async () => {
        // Fallback para endpoint legado se houver
        return await axios.delete(
          `${serverUrl}/chat/deleteMessage/${cleanName}`,
          {
            headers: { apikey: apiKey, 'Content-Type': 'application/json' },
            data: {
              id: providerMessageId,
              remoteJid: targetJid,
              fromMe: true,
              everyone: true,
            },
            timeout: 8000,
          }
        );
      });

      this.logger.log(`[WhatsApp Deletar] Mensagem [${providerMessageId}] apagada para todos na instância [${cleanName}]`);
      return true;
    } catch (err: any) {
      this.logger.warn(`Não foi possível apagar mensagem para todos no WhatsApp: ${err.message}`);
      return false;
    }
  }

  // Cache em memória de contatos da Evolution API (TTL 90 segundos por instância)
  private evoContactsCache = new Map<string, { timestamp: number; contacts: Array<{ id: string; pushName?: string; name?: string; profilePictureUrl?: string | null }> }>();

  /**
   * Extrai o identificador único da foto de perfil do WhatsApp para correspondência biunívoca
   */
  private extractPhotoId(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
      const cleanUrl = url.split('?')[0];
      const match = cleanUrl.match(/([0-9]+_[0-9]+_[0-9]+_n\.jpg)/);
      if (match) return match[1];
      return path.basename(cleanUrl);
    } catch {
      return null;
    }
  }

  /**
   * Normaliza strings de nomes retirando acentos e pontuação
   */
  private normalizeContactName(s: string | null | undefined): string {
    if (!s) return '';
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Resolve de forma síncrona o número real e nome salvo na agenda do celular
   * para contatos que chegam com identificador interno @lid (ex: 173680038539435@lid).
   */
  async resolveContactFromEvolution(
    tenantId: string,
    instanceName?: string,
    remoteJid?: string,
    pushName?: string,
    profilePictureUrl?: string | null,
  ): Promise<{ realPhone: string | null; realName: string | null; avatarUrl: string | null }> {
    const isLid = remoteJid && (remoteJid.includes('@lid') || remoteJid.replace(/\D/g, '').length > 13);
    
    // Se já é um número E.164 comum sem @lid, retorna ele mesmo
    if (!isLid && remoteJid) {
      const cleanDigits = remoteJid.replace(/\D/g, '');
      if (cleanDigits.length >= 10 && cleanDigits.length <= 13) {
        return { realPhone: cleanDigits, realName: pushName || null, avatarUrl: profilePictureUrl || null };
      }
    }

    try {
      // 1. Determina a instância Evolution a ser consultada
      let targetInstanceName = instanceName ? (instanceName || '').replace(' (WhatsApp Web)', '').trim() : '';
      if (!targetInstanceName) {
        const inst = await this.prisma.whatsAppInstance.findFirst({
          where: { tenantId, status: { in: ['open', 'connected'] } },
        });
        if (inst?.name) {
          targetInstanceName = (inst.name || '').replace(' (WhatsApp Web)', '').trim();
        }
      }

      if (!targetInstanceName) {
        return { realPhone: null, realName: null, avatarUrl: null };
      }

      const { serverUrl, apiKey } = this.getEvolutionConfig();

      // 2. Consulta o catálogo de contatos salvos da instância (com cache de 90s)
      const now = Date.now();
      let contacts = this.evoContactsCache.get(targetInstanceName)?.contacts;
      const cacheTimestamp = this.evoContactsCache.get(targetInstanceName)?.timestamp || 0;

      if (!contacts || (now - cacheTimestamp > 90 * 1000)) {
        try {
          const res = await axios.post(
            `${serverUrl}/chat/findContacts/${targetInstanceName}`,
            {},
            {
              headers: { apikey: apiKey, 'Content-Type': 'application/json' },
              timeout: 5000,
            }
          );
          if (Array.isArray(res.data) && res.data.length > 0) {
            contacts = res.data;
            this.evoContactsCache.set(targetInstanceName, { timestamp: now, contacts });
          }
        } catch (fetchErr: any) {
          this.logger.warn(`[LID Sync] Falha ao consultar findContacts na instância ${targetInstanceName}: ${fetchErr.message}`);
        }

        // Se falhou ou não retornou contatos, consulta fetchInstances para pegar a sessão ativa no Baileys
        if (!contacts || !contacts.length) {
          try {
            const allInstRes = await axios.get(`${serverUrl}/instance/fetchInstances`, {
              headers: { apikey: apiKey },
              timeout: 4000,
            });
            const allInstances = Array.isArray(allInstRes.data) ? allInstRes.data : [];
            for (const item of allInstances) {
              const instObj = item.instance || item;
              const realName = instObj.instanceName || instObj.name;
              const status = instObj.status || instObj.connectionStatus;
              if (realName && (status === 'open' || status === 'connected')) {
                const retryRes = await axios.post(
                  `${serverUrl}/chat/findContacts/${realName}`,
                  {},
                  {
                    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
                    timeout: 5000,
                  }
                );
                if (Array.isArray(retryRes.data) && retryRes.data.length > 0) {
                  contacts = retryRes.data;
                  this.evoContactsCache.set(targetInstanceName, { timestamp: now, contacts });
                  this.evoContactsCache.set(realName, { timestamp: now, contacts });
                  break;
                }
              }
            }
          } catch (instListErr: any) {
            this.logger.warn(`[LID Sync] Erro ao listar instâncias ativas na Evolution: ${instListErr.message}`);
          }
        }
      }

      if (!contacts || !contacts.length) {
        return { realPhone: null, realName: null, avatarUrl: null };
      }

      // 3. Monta mapas rápidos de busca por foto de perfil e por nome normalizado
      const picToContactMap = new Map<string, { realPhone: string; name?: string; avatarUrl?: string | null }>();
      const nameToContactMap = new Map<string, { realPhone: string; name?: string; avatarUrl?: string | null }>();

      for (const ec of contacts) {
        if (!ec.id || ec.id.includes('@lid')) continue;
        const realPhone = ec.id.replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');
        if (realPhone.length < 10 || realPhone.length > 13) continue;

        const photoId = this.extractPhotoId(ec.profilePictureUrl);
        if (photoId) {
          picToContactMap.set(photoId, {
            realPhone,
            name: ec.pushName || ec.name,
            avatarUrl: ec.profilePictureUrl || null,
          });
        }

        const candidateName = ec.pushName || ec.name;
        const norm = this.normalizeContactName(candidateName);
        if (norm && norm.length >= 3) {
          nameToContactMap.set(norm, {
            realPhone,
            name: candidateName,
            avatarUrl: ec.profilePictureUrl || null,
          });
        }
      }

      // 4. Estratégia A: Cruzamento de Alta Precisão por Foto de Perfil
      const inPhotoId = this.extractPhotoId(profilePictureUrl);
      if (inPhotoId && picToContactMap.has(inPhotoId)) {
        const match = picToContactMap.get(inPhotoId)!;
        this.logger.log(`[LID Mapeado por Foto] Remetente [${remoteJid}] (${pushName}) -> Telefone Real: ${match.realPhone} (${match.name})`);
        return {
          realPhone: match.realPhone,
          realName: pushName || match.name || null,
          avatarUrl: match.avatarUrl || profilePictureUrl || null,
        };
      }

      // 5. Estratégia B: Cruzamento por Nome Exato da Agenda / PushName
      if (pushName && !pushName.includes('@lid') && pushName !== 'Cliente WhatsApp') {
        const inNormName = this.normalizeContactName(pushName);
        const match = nameToContactMap.get(inNormName);

        if (match) {
          this.logger.log(`[LID Mapeado por Nome Exato] Remetente [${remoteJid}] (${pushName}) -> Telefone Real: ${match.realPhone} (${match.name})`);
          return {
            realPhone: match.realPhone,
            realName: pushName || match.name || null,
            avatarUrl: match.avatarUrl || profilePictureUrl || null,
          };
        }
      }

      return { realPhone: null, realName: null, avatarUrl: null };
    } catch (err: any) {
      this.logger.warn(`[LID Resolve] Erro durante a resolução: ${err.message}`);
      return { realPhone: null, realName: null, avatarUrl: null };
    }
  }

  /**
   * Resolve contatos armazenados com identificador @lid para seus números de telefone reais
   * cruzando o catálogo de contatos sincronizados na Evolution API (mesma foto ou pushName).
   */
  async syncAndResolveLidContacts(tenantId: string): Promise<number> {
    try {
      const lidContacts = await this.prisma.contact.findMany({
        where: {
          tenantId,
          OR: [
            { phone: { contains: 'lid' } },
            { name: { contains: 'lid' } },
            { whatsappLid: { not: null } },
            { phone: { startsWith: '173' } }, // Prefixo comum de LIDs de 15 dígitos
          ],
        },
      });

      if (!lidContacts.length) return 0;

      const instances = await this.prisma.whatsAppInstance.findMany({
        where: { tenantId },
      });

      if (!instances.length) return 0;

      let resolvedCount = 0;

      for (const inst of instances) {
        const cleanName = (inst.name || '').replace(' (WhatsApp Web)', '').trim();
        if (!cleanName) continue;

        for (const contact of lidContacts) {
          // Se já tem um número limpo entre 10 e 13 dígitos que não é LID, pula
          const digits = (contact.phone || '').replace(/\D/g, '');
          if (digits.length >= 10 && digits.length <= 13 && !contact.phone.includes('@lid')) {
            continue;
          }

          const resolution = await this.resolveContactFromEvolution(
            tenantId,
            cleanName,
            contact.whatsappLid || contact.phone,
            contact.name,
            contact.avatarUrl
          );

          if (resolution.realPhone) {
            await this.prisma.contact.update({
              where: { id: contact.id },
              data: {
                phone: resolution.realPhone,
                whatsappLid: contact.whatsappLid || contact.phone,
                name: (contact.name && !contact.name.includes('@lid') && contact.name !== 'Cliente WhatsApp')
                  ? contact.name
                  : (resolution.realName || `WhatsApp (${resolution.realPhone})`),
                avatarUrl: contact.avatarUrl || resolution.avatarUrl,
              },
            });

            this.logger.log(`[LID Resolution Retroativa] Contato [${contact.id}] (${contact.name}) atualizado para telefone real: ${resolution.realPhone}`);
            resolvedCount++;
          }
        }
      }

      return resolvedCount;
    } catch (err: any) {
      this.logger.error(`Erro ao resolver contatos LID para tenant [${tenantId}]: ${err.message}`);
      return 0;
    }
  }
}


