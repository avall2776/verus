import { ConfigService } from '@nestjs/config';
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
export declare class VoipService {
    private readonly configService;
    private readonly logger;
    private readonly configFilePath;
    private voipConfig;
    private activeCalls;
    private cdrHistory;
    constructor(configService: ConfigService);
    private loadVoipConfig;
    private saveVoipConfig;
    private initSampleCdr;
    getConfig(): Promise<VoipConfig>;
    updateConfig(dto: UpdateVoipConfigDto): Promise<VoipConfig>;
    originateCall(dto: OriginateCallDto): Promise<ActiveCall>;
    hangupCall(dto: HangupCallDto): Promise<{
        success: boolean;
        message: string;
        cdr: CdrRecord;
    }>;
    sendDtmf(dto: DtmfCallDto): Promise<{
        success: boolean;
        digit: string;
        dtmfHistory: string[];
    }>;
    toggleHold(callId: string): Promise<ActiveCall>;
    transferCall(dto: TransferCallDto): Promise<{
        success: boolean;
        message: string;
        targetDestination: string;
    }>;
    getActiveCalls(): Promise<ActiveCall[]>;
    getCallHistory(): Promise<CdrRecord[]>;
    testConnection(): Promise<unknown>;
}
