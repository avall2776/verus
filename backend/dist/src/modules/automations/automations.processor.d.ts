import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AutomationsService } from './automations.service';
import { PrismaService } from '../../shared/database/prisma.service';
export declare class AutomationsProcessor extends WorkerHost {
    private readonly automationsService;
    private readonly prisma;
    private readonly logger;
    constructor(automationsService: AutomationsService, prisma: PrismaService);
    process(job: Job<any, any, string>): Promise<any>;
}
