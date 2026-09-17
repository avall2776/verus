import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(req: any): Promise<{
        notifications: import("./notifications.service").NotificationItem[];
        unreadCount: number;
    }>;
    markAllAsRead(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    markAsRead(req: any, id: string): Promise<{
        success: boolean;
        notificationId: string;
    }>;
}
