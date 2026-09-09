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
}
