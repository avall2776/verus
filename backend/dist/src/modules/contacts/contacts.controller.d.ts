import { ContactsService } from './contacts.service';
export declare class ContactsController {
    private readonly contactsService;
    constructor(contactsService: ContactsService);
    listContacts(tenantId: string): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        source: string;
        tags: string[];
        lastActive: string;
    }[]>;
    updateTags(tenantId: string, contactId: string, tags: string[]): Promise<{
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        email: string | null;
        source: string;
        tags: string[];
    }>;
}
