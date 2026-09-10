"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function cleanupDuplicates() {
    console.log('Iniciando limpeza de conversas duplicadas...');
    const contacts = await prisma.contact.findMany();
    for (const contact of contacts) {
        const conversations = await prisma.conversation.findMany({
            where: { contactId: contact.id },
            orderBy: { createdAt: 'asc' },
        });
        if (conversations.length > 1) {
            console.log(`Contato ${contact.name} tem ${conversations.length} conversas. Mesclando...`);
            const targetConversation = conversations[conversations.length - 1];
            const oldConversations = conversations.slice(0, conversations.length - 1);
            for (const old of oldConversations) {
                await prisma.message.updateMany({
                    where: { conversationId: old.id },
                    data: { conversationId: targetConversation.id },
                });
                await prisma.conversation.delete({
                    where: { id: old.id },
                });
                console.log(`Conversa antiga ${old.id} mesclada e deletada.`);
            }
        }
    }
    console.log('Limpeza concluída!');
}
cleanupDuplicates()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=cleanup-conversations.js.map