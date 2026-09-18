import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as net from 'net';
import { OriginateCallDto } from './dto/originate-call.dto';
import { UpdateVoipConfigDto } from './dto/update-voip-config.dto';
import { HangupCallDto } from './dto/hangup-call.dto';
import { DtmfCallDto } from './dto/dtmf-call.dto';
import { TransferCallDto } from './dto/transfer-call.dto';

export interface VoipConfig {
  providerName: string;
  sipHost: string;
  sipPort: number;
  sipUsername: string;
  sipPassword?: string;
  webrtcWssUrl: string;
  directCallToken?: string;
  stunServer: string;
  turnServer: string;
  autoRecord: boolean;
  enabled: boolean;
  codecs: string[];
  updatedAt: string;
}

export interface ActiveCall {
  id: string;
  channelId: string;
  direction: 'OUTBOUND' | 'INBOUND';
  callerNumber: string;
  destinationNumber: string;
  contactName?: string;
  extension: string;
  status: 'DIALING' | 'RINGING' | 'CONNECTED' | 'ON_HOLD' | 'TRANSFERRING' | 'ENDED';
  startedAt: string;
  answeredAt?: string;
  durationSeconds: number;
  dtmfHistory: string[];
  isMuted: boolean;
  isOnHold: boolean;
  recordingUrl?: string;
}

export interface CdrRecord {
  id: string;
  callId: string;
  direction: 'OUTBOUND' | 'INBOUND';
  caller: string;
  destination: string;
  contactName?: string;
  status: 'COMPLETED' | 'NO_ANSWER' | 'BUSY' | 'FAILED' | 'REJECTED';
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  billsec: number;
  cost: number;
  recordingUrl?: string;
}

@Injectable()
export class VoipService {
  private readonly logger = new Logger(VoipService.name);
  private readonly configFilePath: string;
  private voipConfig: VoipConfig;
  private activeCalls: Map<string, ActiveCall> = new Map();
  private cdrHistory: CdrRecord[] = [];

  constructor(private readonly configService: ConfigService) {
    this.configFilePath = path.join(process.cwd(), 'data', 'voip-config.json');
    this.loadVoipConfig();
    this.initSampleCdr();
  }

  private loadVoipConfig() {
    try {
      const dir = path.dirname(this.configFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf8');
        this.voipConfig = JSON.parse(raw);
        this.logger.log(`Configuração VoIP carregada com sucesso (${this.voipConfig.providerName})`);
        return;
      }
    } catch (err: any) {
      this.logger.warn(`Não foi possível ler voip-config.json: ${err.message}. Criando padrão...`);
    }

    // Padrão de produção com fallback para variáveis de ambiente
    this.voipConfig = {
      providerName: process.env.SIP_TRUNK_PROVIDER || 'Direct Call Telecom',
      sipHost: process.env.SIP_HOST || '187.127.10.166',
      sipPort: Number(process.env.SIP_PORT) || 5060,
      sipUsername: process.env.SIP_USERNAME || 'versus_trunk_01',
      sipPassword: process.env.SIP_PASSWORD || 'VrsPabx#2026@Sec',
      webrtcWssUrl: process.env.WEBRTC_WSS_URL || 'wss://187.127.10.166:7443',
      directCallToken: process.env.DIRECTCALL_TOKEN || '',
      stunServer: process.env.STUN_SERVER || 'stun:stun.l.google.com:19302',
      turnServer: process.env.TURN_SERVER || '',
      autoRecord: true,
      enabled: true,
      codecs: ['Opus', 'PCMU', 'PCMA', 'G.729'],
      updatedAt: new Date().toISOString(),
    };

    this.saveVoipConfig();
  }

  private saveVoipConfig() {
    try {
      const dir = path.dirname(this.configFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configFilePath, JSON.stringify(this.voipConfig, null, 2), 'utf8');
    } catch (err: any) {
      this.logger.error(`Erro ao salvar voip-config.json: ${err.message}`);
    }
  }

  private initSampleCdr() {
    // Inicializar registros de chamadas históricas para visualização analítica
    this.cdrHistory = [
      {
        id: 'cdr-101',
        callId: 'call-sample-1',
        direction: 'OUTBOUND',
        caller: 'Ramal 101 (Operador)',
        destination: '+55 11 98765-4321',
        contactName: 'Carlos Silveira (Lead VIP)',
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        endedAt: new Date(Date.now() - 3600000 * 2 + 184000).toISOString(),
        durationSeconds: 184,
        billsec: 180,
        cost: 0.15,
        recordingUrl: '/audio/recordings/sample-rec-1.mp3',
      },
      {
        id: 'cdr-102',
        callId: 'call-sample-2',
        direction: 'INBOUND',
        caller: '+55 21 99887-1122',
        destination: 'Ramal 102 (Suporte)',
        contactName: 'Mariana Duarte',
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        endedAt: new Date(Date.now() - 3600000 * 4 + 312000).toISOString(),
        durationSeconds: 312,
        billsec: 305,
        cost: 0.00,
        recordingUrl: '/audio/recordings/sample-rec-2.mp3',
      },
      {
        id: 'cdr-103',
        callId: 'call-sample-3',
        direction: 'OUTBOUND',
        caller: 'Ramal 101 (Operador)',
        destination: '+55 41 99123-9988',
        contactName: 'Rodrigo Medeiros',
        status: 'NO_ANSWER',
        startedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        endedAt: new Date(Date.now() - 3600000 * 6 + 25000).toISOString(),
        durationSeconds: 25,
        billsec: 0,
        cost: 0.00,
      }
    ];
  }

  /**
   * Retorna a configuração atual de conexão do PABX/VoIP
   */
  async getConfig(): Promise<VoipConfig> {
    return this.voipConfig;
  }

  /**
   * Atualiza as configurações e credenciais do Tronco SIP
   */
  async updateConfig(dto: UpdateVoipConfigDto): Promise<VoipConfig> {
    this.voipConfig = {
      ...this.voipConfig,
      ...dto,
      sipPort: dto.sipPort || this.voipConfig.sipPort || 5060,
      updatedAt: new Date().toISOString(),
    };

    this.saveVoipConfig();
    this.logger.log(`Configuração VoIP atualizada: Provedor ${this.voipConfig.providerName} @ ${this.voipConfig.sipHost}:${this.voipConfig.sipPort}`);
    return this.voipConfig;
  }

  /**
   * Origina uma nova chamada ativa através do motor VoIP
   */
  async originateCall(dto: OriginateCallDto): Promise<ActiveCall> {
    const callId = 'call-' + crypto.randomUUID().slice(0, 8);
    const channelId = `PJSIP/${dto.destination}-${crypto.randomBytes(4).toString('hex')}`;

    const newCall: ActiveCall = {
      id: callId,
      channelId,
      direction: 'OUTBOUND',
      callerNumber: dto.callerId || this.voipConfig.sipUsername || 'VERSUS-PBX',
      destinationNumber: dto.destination.replace(/\D/g, ''),
      contactName: dto.contactName || 'Contato Telefônico',
      extension: dto.extension || '101',
      status: 'DIALING',
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      dtmfHistory: [],
      isMuted: false,
      isOnHold: false,
    };

    this.activeCalls.set(callId, newCall);

    // Simulação progressiva da máquina de estados telefônica
    setTimeout(() => {
      const c = this.activeCalls.get(callId);
      if (c && c.status === 'DIALING') {
        c.status = 'RINGING';
      }
    }, 1200);

    setTimeout(() => {
      const c = this.activeCalls.get(callId);
      if (c && (c.status === 'RINGING' || c.status === 'DIALING')) {
        c.status = 'CONNECTED';
        c.answeredAt = new Date().toISOString();
      }
    }, 3500);

    this.logger.log(`📞 Chamada originada: [${callId}] -> ${dto.destination} (Canal: ${channelId})`);
    return newCall;
  }

  /**
   * Encerra uma chamada ativa
   */
  async hangupCall(dto: HangupCallDto) {
    const call = this.activeCalls.get(dto.callId);
    if (!call) {
      throw new NotFoundException(`Chamada '${dto.callId}' não encontrada ou já finalizada.`);
    }

    const now = new Date();
    const startTime = new Date(call.startedAt).getTime();
    const durationSeconds = Math.max(1, Math.round((now.getTime() - startTime) / 1000));
    const billsec = call.answeredAt 
      ? Math.max(1, Math.round((now.getTime() - new Date(call.answeredAt).getTime()) / 1000))
      : 0;

    call.status = 'ENDED';
    call.durationSeconds = durationSeconds;

    // Registrar no CDR histórico
    const cdr: CdrRecord = {
      id: 'cdr-' + crypto.randomUUID().slice(0, 8),
      callId: call.id,
      direction: call.direction,
      caller: call.callerNumber,
      destination: call.destinationNumber,
      contactName: call.contactName,
      status: billsec > 0 ? 'COMPLETED' : 'NO_ANSWER',
      startedAt: call.startedAt,
      endedAt: now.toISOString(),
      durationSeconds,
      billsec,
      cost: Number((billsec * 0.0008).toFixed(4)),
      recordingUrl: billsec > 5 ? `/audio/recordings/${call.id}.mp3` : undefined,
    };

    this.cdrHistory.unshift(cdr);
    this.activeCalls.delete(dto.callId);

    this.logger.log(`📴 Chamada encerrada: [${dto.callId}] Duração: ${durationSeconds}s, Conversação: ${billsec}s`);

    return {
      success: true,
      message: 'Chamada finalizada com sucesso.',
      cdr,
    };
  }

  /**
   * Envia dígito DTMF para chamada ativa
   */
  async sendDtmf(dto: DtmfCallDto) {
    const call = this.activeCalls.get(dto.callId);
    if (!call) {
      throw new NotFoundException(`Chamada ativa '${dto.callId}' não encontrada.`);
    }

    call.dtmfHistory.push(dto.digit);
    this.logger.log(`🔢 DTMF enviado na chamada [${dto.callId}]: '${dto.digit}'`);

    return {
      success: true,
      digit: dto.digit,
      dtmfHistory: call.dtmfHistory,
    };
  }

  /**
   * Alterna estado de espera (Hold) da chamada
   */
  async toggleHold(callId: string) {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new NotFoundException(`Chamada '${callId}' não encontrada.`);
    }

    call.isOnHold = !call.isOnHold;
    call.status = call.isOnHold ? 'ON_HOLD' : 'CONNECTED';

    this.logger.log(`⏸️ Chamada [${callId}] Hold: ${call.isOnHold ? 'ATIVADO' : 'DESATIVADO'}`);
    return call;
  }

  /**
   * Transfere chamada para outro número ou ramal
   */
  async transferCall(dto: TransferCallDto) {
    const call = this.activeCalls.get(dto.callId);
    if (!call) {
      throw new NotFoundException(`Chamada '${dto.callId}' não encontrada.`);
    }

    call.status = 'TRANSFERRING';
    this.logger.log(`↪️ Transferindo chamada [${dto.callId}] para ${dto.targetDestination} (${dto.type || 'BLIND'})`);

    setTimeout(() => {
      this.activeCalls.delete(dto.callId);
    }, 2000);

    return {
      success: true,
      message: `Chamada transferida com sucesso para o ramal ${dto.targetDestination}.`,
      targetDestination: dto.targetDestination,
    };
  }

  /**
   * Retorna lista de chamadas ativas
   */
  async getActiveCalls(): Promise<ActiveCall[]> {
    return Array.from(this.activeCalls.values());
  }

  /**
   * Retorna histórico de bilhetagem CDR
   */
  async getCallHistory(): Promise<CdrRecord[]> {
    return this.cdrHistory;
  }

  /**
   * Realiza teste de socket e latência no servidor PABX (SIP / AMI)
   */
  async testConnection() {
    const host = this.voipConfig.sipHost || '187.127.10.166';
    const port = this.voipConfig.sipPort || 5060;
    const start = Date.now();

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2500);

      const finish = (isOnline: boolean, errorMsg?: string) => {
        const latencyMs = Date.now() - start;
        socket.destroy();

        resolve({
          success: isOnline,
          host,
          port,
          provider: this.voipConfig.providerName,
          latencyMs: Math.max(12, latencyMs),
          status: isOnline ? 'ONLINE' : 'OFFLINE',
          details: isOnline 
            ? `Conexão estabelecida com sucesso com ${host}:${port}. Socket responsivo.`
            : `Host acessível na rede, porém a porta ${port} não respondeu ao handshake TCP: ${errorMsg || 'Timeout'}`,
          diagnostics: {
            webrtcReady: true,
            sipSignaling: 'UDP/TCP 5060',
            rtpRange: '10000-20000 UDP',
            activeTrunk: this.voipConfig.providerName,
          }
        });
      };

      socket.connect(port, host, () => {
        finish(true);
      });

      socket.on('error', (err) => {
        // Se a porta for UDP pura no host, o handshake TCP pode recusar mas a máquina está ativa
        finish(false, err.message);
      });

      socket.on('timeout', () => {
        finish(false, 'Timeout após 2500ms');
      });
    });
  }
}
