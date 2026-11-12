import { PrismaService } from '../../shared/database/prisma.service';
export interface NotificationItem {
    id: string;
    type: 'CHAT' | 'SUPPORT' | 'GOAL' | 'SYSTEM';
    title: string;
    description: string;
    createdAt: string;
    isRead: boolean;
    link?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
    metadata?: any;
}
export declare class NotificationsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getNotifications(tenantId: string, userId: string): Promise<{
        notifications: NotificationItem[];
        unreadCount: number;
    }>;
    markAllAsRead(tenantId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    markAsRead(tenantId: string, userId: string, notificationId: string): Promise<{
        success: boolean;
        notificationId: string;
    }>;
    getVapidPublicKey(): {
        publicKey: string;
    };
    savePushSubscription(tenantId: string, userId: string, sub: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
        userAgent?: string;
    }): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    removePushSubscription(endpoint: string): Promise<{
        success: boolean;
    }>;
    sendPushToUser(tenantId: string, userId: string, payload: {
        title: string;
        body: string;
        url?: string;
        tag?: string;
    }): Promise<void>;
    sendPushToDepartment(tenantId: string, departmentId: string, payload: {
        title: string;
        body: string;
        url?: string;
        tag?: string;
    }): Promise<void>;
}
