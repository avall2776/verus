import { MonitorService } from './monitor.service';
export declare class MonitorController {
    private readonly monitorService;
    constructor(monitorService: MonitorService);
    getActiveConversations(tenantId: string): Promise<any>;
}
