import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AutomationsService } from '../../automations/automations.service';
export declare class AutomationsProcessor extends WorkerHost {
    private readonly prisma;
    private readonly automationsService;
    private readonly logger;
    constructor(prisma: PrismaService, automationsService: AutomationsService);
    process(job: Job<any, any, string>): Promise<any>;
}
