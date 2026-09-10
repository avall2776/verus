"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const conversation = await prisma.conversation.findFirst({
        include: { contact: true }
    });
    if (!conversation)
        return console.log("No conversations");
    try {
        const msg = await prisma.message.create({
            data: {
                tenantId: conversation.tenantId,
                conversationId: conversation.id,
                providerMessageId: `manual_${Date.now()}`,
                contactId: conversation.contactId,
                content: "Teste",
                type: "text",
                mediaUrl: null,
                isInternal: false,
                direction: 'OUTBOUND',
                senderType: 'user',
                status: 'delivered',
            }
        });
        console.log("Success:", msg);
    }
    catch (e) {
        console.error("Prisma Error:", e);
    }
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=test-prisma.js.map