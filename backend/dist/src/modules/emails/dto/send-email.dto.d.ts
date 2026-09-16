export declare class SendEmailDto {
    recipientEmail: string;
    recipientName?: string;
    senderName?: string;
    senderEmail?: string;
    cc?: string;
    bcc?: string;
    subject: string;
    bodyText: string;
    bodyHtml?: string;
    contactId?: string;
    dealId?: string;
    proposalId?: string;
    contractId?: string;
    threadId?: string;
    folder?: string;
    attachments?: any;
}
