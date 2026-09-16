export interface EmailAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface EmailContact {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

export interface EmailDeal {
  id: string;
  title: string;
  value?: number | null;
  status?: string | null;
}

export interface EmailItem {
  id: string;
  tenantId: string;
  contactId?: string | null;
  dealId?: string | null;
  proposalId?: string | null;
  contractId?: string | null;
  threadId?: string | null;

  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  recipientName?: string | null;
  cc?: string | null;
  bcc?: string | null;

  subject: string;
  bodyText: string;
  bodyHtml?: string | null;
  preview?: string | null;

  folder: 'INBOX' | 'SENT' | 'DRAFT' | 'TRASH' | 'ARCHIVE' | string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: EmailAttachment[] | null;

  sentAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  contact?: EmailContact | null;
  deal?: EmailDeal | null;
}

export interface EmailFolderCounts {
  inbox: number;
  unread: number;
  starred: number;
  sent: number;
  draft: number;
  trash: number;
  archive: number;
}
