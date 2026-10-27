import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
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
