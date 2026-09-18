import { VoipService } from './voip.service';
import { OriginateCallDto } from './dto/originate-call.dto';
import { UpdateVoipConfigDto } from './dto/update-voip-config.dto';
import { HangupCallDto } from './dto/hangup-call.dto';
import { DtmfCallDto } from './dto/dtmf-call.dto';
import { TransferCallDto } from './dto/transfer-call.dto';
export declare class VoipController {
    private readonly voipService;
    constructor(voipService: VoipService);
    getConfig(req: any): Promise<import("./voip.service").VoipConfig>;
    updateConfig(req: any, dto: UpdateVoipConfigDto): Promise<import("./voip.service").VoipConfig>;
    originateCall(req: any, dto: OriginateCallDto): Promise<import("./voip.service").ActiveCall>;
    hangupCall(req: any, dto: HangupCallDto): Promise<{
        success: boolean;
        message: string;
        cdr: import("./voip.service").CdrRecord;
    }>;
    sendDtmf(req: any, dto: DtmfCallDto): Promise<{
        success: boolean;
        digit: string;
        dtmfHistory: string[];
    }>;
    toggleHold(req: any, id: string): Promise<import("./voip.service").ActiveCall>;
    transferCall(req: any, dto: TransferCallDto): Promise<{
        success: boolean;
        message: string;
        targetDestination: string;
    }>;
    getActiveCalls(req: any): Promise<import("./voip.service").ActiveCall[]>;
    getCallHistory(req: any): Promise<import("./voip.service").CdrRecord[]>;
    testConnection(req: any): Promise<unknown>;
}
