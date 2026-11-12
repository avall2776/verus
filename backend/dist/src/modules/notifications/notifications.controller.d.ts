import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getVapidPublicKey(): {
        publicKey: string;
    };
    savePushSubscription(tenantId: string, req: any, body: {
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
    removePushSubscription(body: {
        endpoint: string;
    }): Promise<{
        success: boolean;
    }>;
    testPush(tenantId: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getNotifications(tenantId: string, req: any): Promise<{
        notifications: import("./notifications.service").NotificationItem[];
        unreadCount: number;
    }>;
    markAllAsRead(tenantId: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    markAsRead(tenantId: string, req: any, id: string): Promise<{
        success: boolean;
        notificationId: string;
    }>;
}
